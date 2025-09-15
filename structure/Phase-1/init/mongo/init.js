// MongoDB initialization script
// This script runs when the MongoDB container is first created

// Switch to philosophy_db database
db = db.getSiblingDB('philosophy_db');

// Create collections with validation schemas
db.createCollection('theses', {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["concept_id", "type", "content", "style", "created_at"],
            properties: {
                thesis_id: {
                    bsonType: "objectId",
                    description: "must be an objectId and is required"
                },
                concept_id: {
                    bsonType: "string",
                    pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
                    description: "must be a valid UUID string"
                },
                type: {
                    enum: ["ontological", "epistemological", "axiological", "ethical", "aesthetic", 
                           "metaphysical", "logical", "practical", "political", "theological", 
                           "anthropological", "social", "linguistic", "phenomenological", 
                           "existential", "analytical", "hermeneutical", "cross_disciplinary"],
                    description: "must be a valid thesis type"
                },
                content: {
                    bsonType: "string",
                    minLength: 10,
                    maxLength: 5000,
                    description: "must be a string between 10 and 5000 characters"
                },
                related_categories: {
                    bsonType: "array",
                    items: {
                        bsonType: "string",
                        pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
                    },
                    description: "must be an array of valid UUID strings"
                },
                style: {
                    enum: ["academic", "popular", "aphoristic", "dialogical", "analytical"],
                    description: "must be a valid style"
                },
                generation_parameters: {
                    bsonType: "object",
                    description: "parameters used for generation"
                },
                created_at: {
                    bsonType: "date",
                    description: "must be a date"
                },
                parent_theses: {
                    bsonType: "array",
                    items: {
                        bsonType: "objectId"
                    },
                    description: "array of parent thesis IDs for synthesized theses"
                }
            }
        }
    }
});

// Create indexes for theses
db.theses.createIndex({ concept_id: 1 });
db.theses.createIndex({ type: 1 });
db.theses.createIndex({ created_at: -1 });
db.theses.createIndex({ concept_id: 1, type: 1 });
db.theses.createIndex({ related_categories: 1 });
db.theses.createIndex({ "$**": "text" }); // Full-text search

// Create categoryDescriptions collection
db.createCollection('categoryDescriptions', {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["category_id", "detailed_description", "created_at"],
            properties: {
                category_id: {
                    bsonType: "string",
                    pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
                },
                detailed_description: {
                    bsonType: "string",
                    minLength: 50
                },
                alternative_interpretations: {
                    bsonType: "array",
                    items: {
                        bsonType: "string"
                    }
                },
                historical_analogues: {
                    bsonType: "array",
                    items: {
                        bsonType: "object"
                    }
                },
                related_concepts: {
                    bsonType: "array",
                    items: {
                        bsonType: "object"
                    }
                },
                claude_generation_id: {
                    bsonType: "string",
                    pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
                },
                created_at: {
                    bsonType: "date"
                },
                last_modified: {
                    bsonType: "date"
                }
            }
        }
    }
});

// Create indexes for categoryDescriptions
db.categoryDescriptions.createIndex({ category_id: 1 }, { unique: true });
db.categoryDescriptions.createIndex({ created_at: -1 });
db.categoryDescriptions.createIndex({ "$**": "text" });

// Create relationshipDescriptions collection
db.createCollection('relationshipDescriptions', {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["relationship_id", "philosophical_foundation", "created_at"],
            properties: {
                relationship_id: {
                    bsonType: "string",
                    pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
                },
                philosophical_foundation: {
                    bsonType: "string",
                    minLength: 50
                },
                counterarguments: {
                    bsonType: "array",
                    items: {
                        bsonType: "string"
                    }
                },
                analogues: {
                    bsonType: "array",
                    items: {
                        bsonType: "object"
                    }
                },
                claude_generation_id: {
                    bsonType: "string",
                    pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
                },
                created_at: {
                    bsonType: "date"
                },
                last_modified: {
                    bsonType: "date"
                }
            }
        }
    }
});

// Create indexes for relationshipDescriptions
db.relationshipDescriptions.createIndex({ relationship_id: 1 }, { unique: true });
db.relationshipDescriptions.createIndex({ created_at: -1 });

// Create generatedElements collection for tracking new categories and relationship types
db.createCollection('generatedElements', {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["concept_id", "element_type", "element_name", "is_new", "is_approved"],
            properties: {
                element_id: {
                    bsonType: "objectId"
                },
                concept_id: {
                    bsonType: "string",
                    pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
                },
                element_type: {
                    enum: ["category", "relationship_type"],
                    description: "Type of generated element"
                },
                element_name: {
                    bsonType: "string",
                    description: "Name of the element"
                },
                element_definition: {
                    bsonType: "string",
                    description: "Definition or description of the element"
                },
                is_new: {
                    bsonType: "bool",
                    description: "Whether this element is new to the system"
                },
                is_approved: {
                    bsonType: "bool",
                    description: "Whether this element has been approved by user"
                },
                approved_by: {
                    bsonType: "string",
                    pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
                    description: "User who approved the element"
                },
                approved_at: {
                    bsonType: "date",
                    description: "When the element was approved"
                },
                created_at: {
                    bsonType: "date"
                }
            }
        }
    }
});

// Create indexes for generatedElements
db.generatedElements.createIndex({ concept_id: 1 });
db.generatedElements.createIndex({ element_type: 1 });
db.generatedElements.createIndex({ is_new: 1, is_approved: 1 });
db.generatedElements.createIndex({ created_at: -1 });

// Create other collections
db.createCollection('conceptAnalyses');
db.createCollection('dialogues');
db.createCollection('historicalContexts');
db.createCollection('practicalApplications');
db.createCollection('conceptEvolutions');

// Create a system info collection
db.systemInfo.insertOne({
    initialized: true,
    version: "1.0.0",
    createdAt: new Date(),
    description: "Philosophy Service MongoDB initialized successfully"
});

print("MongoDB initialization completed successfully!");