/**
 * MongoDB Migration: Create Collections
 * Description: Creates the initial collections for the philosophy service
 */

// Migration metadata
const migrationName = '00001_create_collections';
const description = 'Creates the initial collections for the philosophy service';

// Migration function
async function up(db) {
  console.log(`Running migration: ${migrationName}`);
  console.log(`Description: ${description}`);
  
  try {
    // Create collections with basic validation
    await db.createCollection('theses', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['thesis_id', 'concept_id', 'type', 'content', 'style'],
          properties: {
            thesis_id: {
              bsonType: 'string',
              description: 'UUID of the thesis'
            },
            concept_id: {
              bsonType: 'string',
              description: 'UUID of the parent concept'
            },
            type: {
              bsonType: 'string',
              description: 'Type of thesis'
            },
            content: {
              bsonType: 'string',
              description: 'Content of the thesis'
            },
            style: {
              bsonType: 'string',
              description: 'Style of the thesis'
            }
          }
        }
      }
    });
    console.log('Created collection: theses');
    
    await db.createCollection('categoryDescriptions', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['description_id', 'category_id', 'detailed_description'],
          properties: {
            description_id: {
              bsonType: 'string',
              description: 'UUID of the description'
            },
            category_id: {
              bsonType: 'string',
              description: 'UUID of the category'
            },
            detailed_description: {
              bsonType: 'string',
              description: 'Detailed description of the category'
            }
          }
        }
      }
    });
    console.log('Created collection: categoryDescriptions');
    
    await db.createCollection('relationshipDescriptions', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['description_id', 'relationship_id', 'philosophical_foundation'],
          properties: {
            description_id: {
              bsonType: 'string',
              description: 'UUID of the description'
            },
            relationship_id: {
              bsonType: 'string',
              description: 'UUID of the relationship'
            },
            philosophical_foundation: {
              bsonType: 'string',
              description: 'Philosophical foundation of the relationship'
            }
          }
        }
      }
    });
    console.log('Created collection: relationshipDescriptions');
    
    await db.createCollection('conceptAnalyses', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['analysis_id', 'concept_id', 'analysis_type', 'content'],
          properties: {
            analysis_id: {
              bsonType: 'string',
              description: 'UUID of the analysis'
            },
            concept_id: {
              bsonType: 'string',
              description: 'UUID of the concept'
            },
            analysis_type: {
              bsonType: 'string',
              description: 'Type of analysis'
            },
            content: {
              bsonType: 'string',
              description: 'Content of the analysis'
            }
          }
        }
      }
    });
    console.log('Created collection: conceptAnalyses');
    
    await db.createCollection('dialogues', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['dialogue_id', 'philosophical_question', 'dialogue_content'],
          properties: {
            dialogue_id: {
              bsonType: 'string',
              description: 'UUID of the dialogue'
            },
            philosophical_question: {
              bsonType: 'string',
              description: 'Philosophical question discussed in the dialogue'
            },
            dialogue_content: {
              bsonType: 'string',
              description: 'Content of the dialogue'
            }
          }
        }
      }
    });
    console.log('Created collection: dialogues');
    
    await db.createCollection('historicalContexts', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['context_id', 'concept_id', 'time_period', 'historical_analysis'],
          properties: {
            context_id: {
              bsonType: 'string',
              description: 'UUID of the historical context'
            },
            concept_id: {
              bsonType: 'string',
              description: 'UUID of the concept'
            },
            time_period: {
              bsonType: 'string',
              description: 'Historical time period'
            },
            historical_analysis: {
              bsonType: 'string',
              description: 'Historical analysis of the concept'
            }
          }
        }
      }
    });
    console.log('Created collection: historicalContexts');
    
    await db.createCollection('practicalApplications', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['application_id', 'concept_id', 'application_analysis'],
          properties: {
            application_id: {
              bsonType: 'string',
              description: 'UUID of the practical application'
            },
            concept_id: {
              bsonType: 'string',
              description: 'UUID of the concept'
            },
            application_analysis: {
              bsonType: 'string',
              description: 'Analysis of practical applications'
            }
          }
        }
      }
    });
    console.log('Created collection: practicalApplications');
    
    await db.createCollection('conceptEvolutions', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['evolution_id', 'concept_id'],
          properties: {
            evolution_id: {
              bsonType: 'string',
              description: 'UUID of the evolution'
            },
            concept_id: {
              bsonType: 'string',
              description: 'UUID of the concept'
            },
            target_concept_id: {
              bsonType: 'string',
              description: 'UUID of the target concept (if created)'
            },
            evolution_context: {
              bsonType: 'string',
              description: 'Context of the evolution'
            }
          }
        }
      }
    });
    console.log('Created collection: conceptEvolutions');
    
    // Create migrations collection to track applied migrations
    await db.createCollection('migrations', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'applied_at'],
          properties: {
            name: {
              bsonType: 'string',
              description: 'Name of the migration'
            },
            applied_at: {
              bsonType: 'date',
              description: 'Date and time the migration was applied'
            }
          }
        }
      }
    });
    console.log('Created collection: migrations');
    
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
    // Drop all created collections
    await db.collection('theses').drop();
    await db.collection('categoryDescriptions').drop();
    await db.collection('relationshipDescriptions').drop();
    await db.collection('conceptAnalyses').drop();
    await db.collection('dialogues').drop();
    await db.collection('historicalContexts').drop();
    await db.collection('practicalApplications').drop();
    await db.collection('conceptEvolutions').drop();
    
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
