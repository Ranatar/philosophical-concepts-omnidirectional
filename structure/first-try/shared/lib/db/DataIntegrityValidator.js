// shared/lib/db/DataIntegrityValidator.js

class DataIntegrityValidator {
  constructor(databaseManager) {
    this.dbManager = databaseManager;
    this.validationResults = [];
  }

  async validateAllConcepts() {
    console.log('Starting data integrity validation...');
    this.validationResults = [];
    
    // Получение всех концепций из PostgreSQL
    const pgResult = await this.dbManager.postgresPool.query(
      'SELECT concept_id FROM concepts'
    );
    
    const conceptIds = pgResult.rows.map(row => row.concept_id);
    console.log(`Found ${conceptIds.length} concepts to validate`);
    
    for (const conceptId of conceptIds) {
      await this.validateConcept(conceptId);
    }
    
    return this.generateReport();
  }

  async validateConcept(conceptId) {
    const issues = [];
    
    try {
      // 1. Проверка наличия в PostgreSQL
      const pgResult = await this.dbManager.postgresPool.query(
        'SELECT * FROM concepts WHERE concept_id = $1',
        [conceptId]
      );
      
      if (pgResult.rows.length === 0) {
        issues.push({
          type: 'missing_in_postgres',
          severity: 'critical',
          description: `Concept ${conceptId} not found in PostgreSQL`
        });
        
        this.validationResults.push({
          conceptId,
          status: 'failed',
          issues
        });
        return;
      }
      
      const conceptMetadata = pgResult.rows[0];
      
      // 2. Проверка наличия в Neo4j
      const neo4jSession = this.dbManager.neo4jDriver.session();
      const neo4jResult = await neo4jSession.run(
        'MATCH (c:Concept {concept_id: $conceptId}) RETURN c',
        { conceptId }
      );
      await neo4jSession.close();
      
      if (neo4jResult.records.length === 0) {
        issues.push({
          type: 'missing_in_neo4j',
          severity: 'critical',
          description: `Concept ${conceptId} not found in Neo4j`
        });
      } else {
        // Проверка соответствия данных
        const neo4jConcept = neo4jResult.records[0].get('c').properties;
        if (neo4jConcept.name !== conceptMetadata.name) {
          issues.push({
            type: 'data_mismatch',
            severity: 'high',
            description: `Name mismatch: PostgreSQL="${conceptMetadata.name}", Neo4j="${neo4jConcept.name}"`,
            field: 'name'
          });
        }
      }
      
      // 3. Проверка категорий в Neo4j
      const categoriesResult = await neo4jSession.run(`
        MATCH (c:Concept {concept_id: $conceptId})-[:INCLUDES]->(cat:Category)
        RETURN count(cat) as categoryCount
      `, { conceptId });
      
      const categoryCount = categoriesResult.records[0].get('categoryCount').toNumber();
      if (categoryCount === 0) {
        issues.push({
          type: 'no_categories',
          severity: 'warning',
          description: `Concept ${conceptId} has no categories in Neo4j`
        });
      }
      
      // 4. Проверка тезисов в MongoDB
      const thesesCount = await this.dbManager.mongodb
        .collection('theses')
        .countDocuments({ concept_id: conceptId });
      
      if (thesesCount === 0) {
        issues.push({
          type: 'no_theses',
          severity: 'info',
          description: `Concept ${conceptId} has no theses in MongoDB`
        });
      }
      
      // 5. Проверка связей между БД
      await this.validateCrossDBReferences(conceptId);
      
      this.validationResults.push({
        conceptId,
        status: issues.length === 0 ? 'valid' : 'issues_found',
        issues
      });
      
    } catch (error) {
      this.validationResults.push({
        conceptId,
        status: 'error',
        error: error.message,
        issues
      });
    }
  }

  async validateCrossDBReferences(conceptId) {
    const issues = [];
    
    // Проверка ссылок из тезисов на категории
    const theses = await this.dbManager.mongodb
      .collection('theses')
      .find({ concept_id: conceptId })
      .toArray();
    
    for (const thesis of theses) {
      if (thesis.related_categories && thesis.related_categories.length > 0) {
        for (const categoryId of thesis.related_categories) {
          const neo4jSession = this.dbManager.neo4jDriver.session();
          const result = await neo4jSession.run(
            'MATCH (cat:Category {category_id: $categoryId}) RETURN cat',
            { categoryId }
          );
          await neo4jSession.close();
          
          if (result.records.length === 0) {
            issues.push({
              type: 'invalid_reference',
              severity: 'high',
              description: `Thesis references non-existent category ${categoryId}`,
              source: 'mongodb',
              target: 'neo4j'
            });
          }
        }
      }
    }
    
    return issues;
  }

  async fixIntegrityIssues(conceptId, issues) {
    const fixes = [];
    
    for (const issue of issues) {
      try {
        switch (issue.type) {
          case 'missing_in_neo4j':
            await this.recreateConceptInNeo4j(conceptId);
            fixes.push({
              issue: issue.type,
              status: 'fixed',
              action: 'recreated_in_neo4j'
            });
            break;
          
          case 'data_mismatch':
            await this.syncDataFromPostgres(conceptId, issue.field);
            fixes.push({
              issue: issue.type,
              field: issue.field,
              status: 'fixed',
              action: 'synced_from_postgres'
            });
            break;
          
          case 'no_categories':
            // Может потребоваться воссоздание из резервной копии
            fixes.push({
              issue: issue.type,
              status: 'manual_intervention_required',
              action: 'check_backups_or_recreate'
            });
            break;
          
          default:
            fixes.push({
              issue: issue.type,
              status: 'not_implemented',
              action: 'manual_fix_required'
            });
        }
      } catch (error) {
        fixes.push({
          issue: issue.type,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return fixes;
  }

  async recreateConceptInNeo4j(conceptId) {
    // Получение данных из PostgreSQL
    const pgResult = await this.dbManager.postgresPool.query(
      'SELECT * FROM concepts WHERE concept_id = $1',
      [conceptId]
    );
    
    if (pgResult.rows.length === 0) {
      throw new Error(`Concept ${conceptId} not found in PostgreSQL`);
    }
    
    const conceptData = pgResult.rows[0];
    
    // Создание узла концепции в Neo4j
    const neo4jSession = this.dbManager.neo4jDriver.session();
    await neo4jSession.run(`
      CREATE (c:Concept {
        concept_id: $conceptId,
        name: $name,
        description: $description,
        creation_date: datetime($creationDate)
      })
      RETURN c
    `, {
      conceptId: conceptData.concept_id,
      name: conceptData.name,
      description: conceptData.description,
      creationDate: conceptData.creation_date.toISOString()
    });
    
    await neo4jSession.close();
  }

  async syncDataFromPostgres(conceptId, field) {
    // Получение данных из PostgreSQL
    const pgResult = await this.dbManager.postgresPool.query(
      `SELECT ${field} FROM concepts WHERE concept_id = $1`,
      [conceptId]
    );
    
    if (pgResult.rows.length === 0) {
      throw new Error(`Concept ${conceptId} not found in PostgreSQL`);
    }
    
    const value = pgResult.rows[0][field];
    
    // Обновление в Neo4j
    const neo4jSession = this.dbManager.neo4jDriver.session();
    await neo4jSession.run(`
      MATCH (c:Concept {concept_id: $conceptId})
      SET c.${field} = $value
      RETURN c
    `, {
      conceptId,
      value
    });
    
    await neo4jSession.close();
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalConcepts: this.validationResults.length,
      validConcepts: this.validationResults.filter(r => r.status === 'valid').length,
      conceptsWithIssues: this.validationResults.filter(r => r.status === 'issues_found').length,
      errors: this.validationResults.filter(r => r.status === 'error').length,
      issuesByType: {},
      issuesBySeverity: {},
      detailedResults: this.validationResults
    };
    
    // Подсчет проблем по типам
    this.validationResults.forEach(result => {
      if (result.issues) {
        result.issues.forEach(issue => {
          report.issuesByType[issue.type] = 
            (report.issuesByType[issue.type] || 0) + 1;
          report.issuesBySeverity[issue.severity] = 
            (report.issuesBySeverity[issue.severity] || 0) + 1;
        });
      }
    });
    
    return report;
  }

  async saveReportToFile(report, filename) {
    const fs = require('fs').promises;
    await fs.writeFile(filename, JSON.stringify(report, null, 2));
    console.log(`Validation report saved to ${filename}`);
  }
}

module.exports = DataIntegrityValidator;
