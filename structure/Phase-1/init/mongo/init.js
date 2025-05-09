// Initialize MongoDB for development
// This script is executed when the container is first created

// Create a default admin user
db.createUser({
    user: "admin",
    pwd: "admin",
    roles: [
        { role: "readWrite", db: "philosophy" },
        { role: "dbAdmin", db: "philosophy" }
    ]
});

// Use the philosophy database
db = db.getSiblingDB('philosophy');

// Create collections with validators
db.createCollection("theses", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["thesis_id", "concept_id", "type", "content"],
            properties: {
                thesis_id: { bsonType: "string" },
                concept_id: { bsonType: "string" },
                type: { bsonType: "string" },
                content: { bsonType: "string" },
                related_categories: { bsonType: "array" },
                style: { bsonType: "string" },
                created_at: { bsonType: "date" }
            }
        }
    }
});

db.createCollection("categoryDescriptions", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["description_id", "category_id", "detailed_description"],
            properties: {
                description_id: { bsonType: "string" },
                category_id: { bsonType: "string" },
                detailed_description: { bsonType: "string" },
                alternative_interpretations: { bsonType: "array" },
                historical_analogues: { bsonType: "array" },
                created_at: { bsonType: "date" }
            }
        }
    }
});

db.createCollection("relationshipDescriptions", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["description_id", "relationship_id", "philosophical_foundation"],
            properties: {
                description_id: { bsonType: "string" },
                relationship_id: { bsonType: "string" },
                philosophical_foundation: { bsonType: "string" },
                counterarguments: { bsonType: "array" },
                created_at: { bsonType: "date" }
            }
        }
    }
});

// Create indexes
db.theses.createIndex({ "concept_id": 1 });
db.theses.createIndex({ "type": 1 });
db.categoryDescriptions.createIndex({ "category_id": 1 }, { unique: true });
db.relationshipDescriptions.createIndex({ "relationship_id": 1 }, { unique: true });

print("MongoDB initialization completed successfully");
