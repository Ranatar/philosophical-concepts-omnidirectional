/**
 * MongoDB Migration: Create Indexes
 * Description: Creates indexes for MongoDB collections to optimize performance
 */

// Migration metadata
const migrationName = '00002_create_indexes';
const description = 'Creates indexes for MongoDB collections to optimize performance';

// Migration function
async function up(db) {
  console.log(`Running migration: ${migrationName}`);
  console.log(`Description: ${description}`);
  
  try {
    // Create indexes for theses collection
    await db.collection('theses').createIndex({ thesis_id: 1 }, { unique: true });
    await db.collection('theses').createIndex({ concept_id: 1 });
    await db.collection('theses').createIndex({ type: 1 });
    await db.collection('theses').createIndex({ style: 1 });
    await db.collection('theses').createIndex({ created_at: 1 });
    await db.collection('theses').createIndex({ "related_categories": 1 });
    await db.collection('theses').createIndex({ "parent_theses": 1 });
    console.log('Created indexes for collection: theses');
    
    // Create indexes for categoryDescriptions collection
    await db.collection('categoryDescriptions').createIndex({ description_id: 1 }, { unique: true });
    await db.collection('categoryDescriptions').createIndex({ category_id: 1 }, { unique: true });
    await db.collection('categoryDescriptions').createIndex({ claude_generation_id: 1 });
    console.log('Created indexes for collection: categoryDescriptions');
    
    // Create indexes for relationshipDescriptions collection
    await db.collection('relationshipDescriptions').createIndex({ description_id: 1 }, { unique: true });
    await db.collection('relationshipDescriptions').createIndex({ relationship_id: 1 }, { unique: true });
    await db.collection('relationshipDescriptions').createIndex({ claude_generation_id: 1 });
    console.log('Created indexes for collection: relationshipDescriptions');
    
    // Create indexes for conceptAnalyses collection
    await db.collection('conceptAnalyses').createIndex({ analysis_id: 1 }, { unique: true });
    await db.collection('conceptAnalyses').createIndex({ concept_id: 1 });
    await db.collection('conceptAnalyses').createIndex({ analysis_type: 1 });
    await db.collection('conceptAnalyses').createIndex({ claude_generation_id: 1 });
    console.log('Created indexes for collection: conceptAnalyses');
    
    // Create indexes for dialogues collection
    await db.collection('dialogues').createIndex({ dialogue_id: 1 }, { unique: true });
    await db.collection('dialogues').createIndex({ claude_generation_id: 1 });
    await db.collection('dialogues').createIndex({ "concept_ids": 1 });
    console.log('Created indexes for collection: dialogues');
    
    // Create indexes for historicalContexts collection
    await db.collection('historicalContexts').createIndex({ context_id: 1 }, { unique: true });
    await db.collection('historicalContexts').createIndex({ concept_id: 1 });
    await db.collection('historicalContexts').createIndex({ time_period: 1 });
    await db.collection('historicalContexts').createIndex({ claude_generation_id: 1 });
    console.log('Created indexes for collection: historicalContexts');
    
    // Create indexes for practicalApplications collection
    await db.collection('practicalApplications').createIndex({ application_id: 1 }, { unique: true });
    await db.collection('practicalApplications').createIndex({ concept_id: 1 });
    await db.collection('practicalApplications').createIndex({ claude_generation_id: 1 });
    await db.collection('practicalApplications').createIndex({ "domains": 1 });
    console.log('Created indexes for collection: practicalApplications');
    
    // Create indexes for conceptEvolutions collection
    await db.collection('conceptEvolutions').createIndex({ evolution_id: 1 }, { unique: true });
    await db.collection('conceptEvolutions').createIndex({ concept_id: 1 });
    await db.collection('conceptEvolutions').createIndex({ target_concept_id: 1 });
    await db.collection('conceptEvolutions').createIndex({ claude_generation_id: 1 });
    console.log('Created indexes for collection: conceptEvolutions');
    
    // Create index for migrations collection
    await db.collection('migrations').createIndex({ name: 1 }, { unique: true });
    console.log('Created index for collection: migrations');
    
    // Record this migration
    await db.collection('migrations').insertOne({
      name: migrationName,
      applied_at: new Date()
    });
    
    console.log(`Migration ${migrationName} completed successfully`);
    return { success: true };
  } catch (error) {
    console.error(`Migration ${migrationName} failed:`, error);
    return { success: false, error: error.message };
  }
}

// Rollback function
async function down(db) {
  console.log(`Rolling back migration: ${migrationName}`);
  
  try {
    // Drop indexes for theses collection
    await db.collection('theses').dropIndex({ thesis_id: 1 });
    await db.collection('theses').dropIndex({ concept_id: 1 });
    await db.collection('theses').dropIndex({ type: 1 });
    await db.collection('theses').dropIndex({ style: 1 });
    await db.collection('theses').dropIndex({ created_at: 1 });
    await db.collection('theses').dropIndex({ "related_categories": 1 });
    await db.collection('theses').dropIndex({ "parent_theses": 1 });
    
    // Drop indexes for categoryDescriptions collection
    await db.collection('categoryDescriptions').dropIndex({ description_id: 1 });
    await db.collection('categoryDescriptions').dropIndex({ category_id: 1 });
    await db.collection('categoryDescriptions').dropIndex({ claude_generation_id: 1 });
    
    // Drop indexes for relationshipDescriptions collection
    await db.collection('relationshipDescriptions').dropIndex({ description_id: 1 });
    await db.collection('relationshipDescriptions').dropIndex({ relationship_id: 1 });
    await db.collection('relationshipDescriptions').dropIndex({ claude_generation_id: 1 });
    
    // Drop indexes for conceptAnalyses collection
    await db.collection('conceptAnalyses').dropIndex({ analysis_id: 1 });
    await db.collection('conceptAnalyses').dropIndex({ concept_id: 1 });
    await db.collection('conceptAnalyses').dropIndex({ analysis_type: 1 });
    await db.collection('conceptAnalyses').dropIndex({ claude_generation_id: 1 });
    
    // Drop indexes for dialogues collection
    await db.collection('dialogues').dropIndex({ dialogue_id: 1 });
    await db.collection('dialogues').dropIndex({ claude_generation_id: 1 });
    await db.collection('dialogues').dropIndex({ "concept_ids": 1 });
    
    // Drop indexes for historicalContexts collection
    await db.collection('historicalContexts').dropIndex({ context_id: 1 });
    await db.collection('historicalContexts').dropIndex({ concept_id: 1 });
    await db.collection('historicalContexts').dropIndex({ time_period: 1 });
    await db.collection('historicalContexts').dropIndex({ claude_generation_id: 1 });
    
    // Drop indexes for practicalApplications collection
    await db.collection('practicalApplications').dropIndex({ application_id: 1 });
    await db.collection('practicalApplications').dropIndex({ concept_id: 1 });
    await db.collection('practicalApplications').dropIndex({ claude_generation_id: 1 });
    await db.collection('practicalApplications').dropIndex({ "domains": 1 });
    
    // Drop indexes for conceptEvolutions collection
    await db.collection('conceptEvolutions').dropIndex({ evolution_id: 1 });
    await db.collection('conceptEvolutions').dropIndex({ concept_id: 1 });
    await db.collection('conceptEvolutions').dropIndex({ target_concept_id: 1 });
    await db.collection('conceptEvolutions').dropIndex({ claude_generation_id: 1 });
    
    // Remove migration record
    await db.collection('migrations').deleteOne({ name: migrationName });
    
    console.log(`Rollback of ${migrationName} completed successfully`);
    return { success: true };
  } catch (error) {
    console.error(`Rollback of ${migrationName} failed:`, error);
    return { success: false, error: error.message };
  }
}

module.exports = { up, down };
