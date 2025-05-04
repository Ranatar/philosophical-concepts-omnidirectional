// migrations/00001_create_collections.js

db.createCollection("theses", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["concept_id", "type", "content", "created_at"],
      properties: {
        thesis_id: {
          bsonType: "objectId",
          description: "Уникальный идентификатор тезиса"
        },
        concept_id: {
          bsonType: "string",
          pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
          description: "UUID концепции из PostgreSQL"
        },
        type: {
          enum: ["ontological", "epistemological", "ethical", "aesthetic", "political", "metaphysical", "general"],
          description: "Тип философского тезиса"
        },
        content: {
          bsonType: "string",
          minLength: 10,
          maxLength: 5000,
          description: "Содержание тезиса"
        },
        related_categories: {
          bsonType: "array",
          items: {
            bsonType: "string",
            pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
          },
          description: "UUID категорий из Neo4j"
        },
        style: {
          enum: ["academic", "popular", "aphoristic", "dialectical", "analytical"],
          description: "Стиль изложения тезиса"
        },
        generation_parameters: {
          bsonType: "object",
          properties: {
            model: { bsonType: "string" },
            temperature: { bsonType: "number" },
            max_tokens: { bsonType: "int" },
            prompt_template: { bsonType: "string" }
          }
        },
        created_at: {
          bsonType: "date",
          description: "Дата создания"
        },
        updated_at: {
          bsonType: "date",
          description: "Дата последнего обновления"
        },
        parent_theses: {
          bsonType: "array",
          items: {
            bsonType: "objectId"
          },
          description: "ID родительских тезисов (для синтеза)"
        },
        version: {
          bsonType: "int",
          minimum: 1,
          description: "Версия тезиса"
        },
        tags: {
          bsonType: "array",
          items: {
            bsonType: "string"
          },
          description: "Теги для категоризации"
        },
        metadata: {
          bsonType: "object",
          description: "Дополнительные метаданные"
        }
      }
    }
  }
});

// Создание коллекции для описаний категорий
db.createCollection("categoryDescriptions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["category_id", "detailed_description", "created_at"],
      properties: {
        description_id: {
          bsonType: "objectId"
        },
        category_id: {
          bsonType: "string",
          pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
          description: "UUID категории из Neo4j"
        },
        detailed_description: {
          bsonType: "string",
          minLength: 50,
          description: "Развернутое описание категории"
        },
        alternative_interpretations: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["interpretation", "tradition"],
            properties: {
              interpretation: { bsonType: "string" },
              tradition: { bsonType: "string" },
              source: { bsonType: "string" }
            }
          }
        },
        historical_analogues: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["name", "period", "similarity"],
            properties: {
              name: { bsonType: "string" },
              period: { bsonType: "string" },
              similarity: { bsonType: "string" },
              description: { bsonType: "string" }
            }
          }
        },
        related_concepts: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["concept_name", "relationship"],
            properties: {
              concept_name: { bsonType: "string" },
              relationship: { bsonType: "string" },
              description: { bsonType: "string" }
            }
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

// Создание коллекции для описаний связей
db.createCollection("relationshipDescriptions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["relationship_id", "philosophical_foundation", "created_at"],
      properties: {
        description_id: {
          bsonType: "objectId"
        },
        relationship_id: {
          bsonType: "string",
          pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
          description: "UUID связи из Neo4j"
        },
        philosophical_foundation: {
          bsonType: "string",
          minLength: 50,
          description: "Философское обоснование связи"
        },
        counterarguments: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["argument", "source"],
            properties: {
              argument: { bsonType: "string" },
              source: { bsonType: "string" },
              response: { bsonType: "string" }
            }
          }
        },
        analogues: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["concept_pair", "description"],
            properties: {
              concept_pair: { bsonType: "string" },
              description: { bsonType: "string" },
              similarity_degree: { bsonType: "number" }
            }
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

// Создание коллекции для анализов концепций
db.createCollection("conceptAnalyses", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["concept_id", "analysis_type", "content", "created_at"],
      properties: {
        analysis_id: {
          bsonType: "objectId"
        },
        concept_id: {
          bsonType: "string",
          pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
        },
        analysis_type: {
          enum: ["critical", "historical", "comparative", "synthetic", "name_analysis", "origin_detection"],
          description: "Тип анализа"
        },
        content: {
          bsonType: "string",
          minLength: 100
        },
        sections: {
          bsonType: "object",
          properties: {
            introduction: { bsonType: "string" },
            main_analysis: { bsonType: "string" },
            conclusions: { bsonType: "string" },
            recommendations: { bsonType: "string" }
          }
        },
        generation_parameters: {
          bsonType: "object"
        },
        claude_generation_id: {
          bsonType: "string",
          pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
        },
        created_at: {
          bsonType: "date"
        }
      }
    }
  }
});
