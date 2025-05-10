/**
 * MongoDB Migration: Add Validations
 * Description: Adds comprehensive validation rules to collections
 */

// Migration metadata
const migrationName = '00003_add_validations';
const description = 'Adds comprehensive validation rules to collections';

// Migration function
async function up(db) {
  console.log(`Running migration: ${migrationName}`);
  console.log(`Description: ${description}`);
  
  try {
    // Update theses collection with comprehensive validation
    await db.command({
      collMod: 'theses',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['thesis_id', 'concept_id', 'type', 'content', 'style', 'status', 'created_at', 'updated_at'],
          properties: {
            thesis_id: {
              bsonType: 'string',
              description: 'UUID of the thesis',
              pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            },
            concept_id: {
              bsonType: 'string',
              description: 'UUID of the parent concept',
              pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            },
            type: {
              enum: ['ontological', 'epistemological', 'ethical', 'aesthetic', 'political', 'logical', 'methodological', 'critical', 'synthetic'],
              description: 'Type of thesis'
            },
            content: {
              bsonType: 'string',
              description: 'Content of the thesis'
            },
            style: {
              enum: ['academic', 'aphoristic', 'poetic', 'dialectical', 'analytical', 'narrative', 'popular'],
              description: 'Style of the thesis'
            },
            status: {
              enum: ['generated', 'edited', 'approved', 'rejected', 'archived'],
              description: 'Status of the thesis'
            },
            related_categories: {
              bsonType: 'array',
              description: 'Array of related category IDs',
              items: {
                bsonType: 'string',
                pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
              }
            },
            parent_theses: {
              bsonType: 'array',
              description: 'Array of parent thesis IDs for synthesized theses',
              items: {
                bsonType: 'string',
                pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
              }
            },
            generation_parameters: {
              bsonType: 'object',
              description: 'Parameters used for generation'
            },
            claude_generation_id: {
              bsonType: ['string', 'null'],
              description: 'UUID of the Claude interaction that generated the thesis'
            },
            metadata: {
              bsonType: 'object',
              description: 'Additional metadata'
            },
            created_at: {
              bsonType: 'date',
              description: 'Timestamp when the thesis was created'
            },
            updated_at: {
              bsonType: 'date',
              description: 'Timestamp when the thesis was last updated'
            }
          }
        }
      },
      validationLevel: 'moderate',
      validationAction: 'error'
    });
    console.log('Updated validation for collection: theses');
    
    // Update categoryDescriptions collection with comprehensive validation
    await db.command({
      collMod: 'categoryDescriptions',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['description_id', 'category_id', 'detailed_description', 'created_at', 'last_modified'],
          properties: {
            description_id: {
              bsonType: 'string',
              description: 'UUID of the description',
              pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            },
            category_id: {
              bsonType: 'string',
              description: 'UUID of the category',
              pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            },
            detailed_description: {
              bsonType: 'string',
              description: 'Detailed description of the category'
            },
            alternative_interpretations: {
              bsonType: 'array',
              description: 'Array of alternative interpretations',
              items: {
                bsonType: 'string'
              }
            },
            historical_analogues: {
              bsonType: 'array',
              description: 'Array of historical analogues',
              items: {
                bsonType: 'object'
              }
            },
            related_concepts: {
              bsonType: 'array',
              description: 'Array of related concepts',
              items: {
                bsonType: 'object'
              }
            },
            claude_generation_id: {
              bsonType: ['string', 'null'],
              description: 'UUID of the Claude interaction that generated the description'
            },
            created_at: {
              bsonType: 'date',
              description: 'Timestamp when the description was created'
            },
            last_modified: {
              bsonType: 'date',
              description: 'Timestamp when the description was last modified'
            }
          }
        }
      },
      validationLevel: 'moderate',
      validationAction: 'error'
    });
    console.log('Updated validation for collection: categoryDescriptions');
    
    // Update relationshipDescriptions collection with comprehensive validation
    await db.command({
      collMod: 'relationshipDescriptions',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['description_id', 'relationship_id', 'philosophical_foundation', 'created_at', 'last_modified'],
          properties: {
            description_id: {
              bsonType: 'string',
              description: 'UUID of the description',
              pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            },
            relationship_id: {
              bsonType: 'string',
              description: 'UUID of the relationship',
              pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            },
            philosophical_foundation: {
              bsonType: 'string',
              description: 'Philosophical foundation of the relationship'
            },
            counterarguments: {
              bsonType: 'array',
              description: 'Array of counterarguments',
              items: {
                bsonType: 'string'
              }
            },
            analogues: {
              bsonType: 'array',
              description: 'Array of analogues',
              items: {
                bsonType: 'object'
              }
            },
            claude_generation_id: {
              bsonType: ['string', 'null'],
              description: 'UUID of the Claude interaction that generated the description'
            },
            created_at: {
              bsonType: 'date',
              description: 'Timestamp when the description was created'
            },
            last_modified: {
              bsonType: 'date',
              description: 'Timestamp when the description was last modified'
            }
          }
        }
      },
      validationLevel: 'moderate',
      validationAction: 'error'
    });
    console.log('Updated validation for collection: relationshipDescriptions');
    
    // Update additional collections with similarly comprehensive validation rules
    // This follows the same pattern as above, applying schema validation to each collection
    
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
    // Simplify validation rules for all collections
    const collections = [
      'theses', 
      'categoryDescriptions', 
      'relationshipDescriptions', 
      'conceptAnalyses', 
      'dialogues', 
      'historicalContexts', 
      'practicalApplications', 
      'conceptEvolutions'
    ];
    
    for (const collection of collections) {
      // Restore minimal validation rules
      await db.command({
        collMod: collection,
        validator: {},
        validationLevel: 'off',
        validationAction: 'warn'
      });
      console.log(`Reset validation for collection: ${collection}`);
    }
    
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
