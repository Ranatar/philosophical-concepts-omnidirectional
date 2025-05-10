/**
 * MongoDB Seed Data: Test Theses
 * Description: Creates test thesis data for development and testing
 */

// Seed function to create test theses
async function seedTestTheses(db) {
  console.log('Seeding test theses...');
  
  try {
    const thesesCollection = db.collection('theses');
    
    // Test concept ID (from PostgreSQL seed)
    const conceptId = '550e8400-e29b-41d4-a716-446655440000';
    
    // Category IDs (from Neo4j seed)
    const categoryIds = {
      matter: '650e8400-e29b-41d4-a716-446655440001',
      consciousness: '650e8400-e29b-41d4-a716-446655440002',
      dialectics: '650e8400-e29b-41d4-a716-446655440003',
      practice: '650e8400-e29b-41d4-a716-446655440004',
      contradiction: '650e8400-e29b-41d4-a716-446655440005'
    };
    
    // Create test theses
    const testTheses = [
      {
        thesis_id: '850e8400-e29b-41d4-a716-446655440001',
        concept_id: conceptId,
        type: 'ontological',
        content: 'Материя является первичной субстанцией, существующей независимо от сознания и определяющей все формы бытия.',
        style: 'academic',
        status: 'approved',
        related_categories: [categoryIds.matter, categoryIds.consciousness],
        generation_parameters: {
          source: 'manual',
          author: 'test_seed'
        },
        claude_generation_id: null,
        metadata: {
          keywords: ['материя', 'бытие', 'субстанция'],
          references: ['Marx', 'Engels']
        },
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      },
      {
        thesis_id: '850e8400-e29b-41d4-a716-446655440002',
        concept_id: conceptId,
        type: 'epistemological',
        content: 'Познание развивается диалектически через практику, от живого созерцания к абстрактному мышлению и от него к практике.',
        style: 'academic',
        status: 'approved',
        related_categories: [categoryIds.dialectics, categoryIds.practice, categoryIds.consciousness],
        generation_parameters: {
          source: 'manual',
          author: 'test_seed'
        },
        claude_generation_id: null,
        metadata: {
          keywords: ['познание', 'практика', 'мышление'],
          references: ['Lenin']
        },
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      },
      {
        thesis_id: '850e8400-e29b-41d4-a716-446655440003',
        concept_id: conceptId,
        type: 'dialectical',
        content: 'Развитие осуществляется через борьбу противоположностей, их единство и разрешение противоречий.',
        style: 'aphoristic',
        status: 'approved',
        related_categories: [categoryIds.dialectics, categoryIds.contradiction],
        generation_parameters: {
          source: 'manual',
          author: 'test_seed'
        },
        claude_generation_id: null,
        metadata: {
          keywords: ['противоречие', 'развитие', 'борьба'],
          references: ['Hegel', 'Marx']
        },
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      },
      {
        thesis_id: '850e8400-e29b-41d4-a716-446655440004',
        concept_id: conceptId,
        type: 'methodological',
        content: 'Диалектический метод требует рассмотрения явлений в их развитии, взаимосвязи и противоречивости.',
        style: 'academic',
        status: 'approved',
        related_categories: [categoryIds.dialectics],
        generation_parameters: {
          source: 'manual',
          author: 'test_seed'
        },
        claude_generation_id: null,
        metadata: {
          keywords: ['метод', 'диалектика', 'развитие'],
          references: ['Engels']
        },
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      },
      {
        thesis_id: '850e8400-e29b-41d4-a716-446655440005',
        concept_id: conceptId,
        type: 'ethical',
        content: 'Практика преобразования мира является высшим нравственным императивом, объединяющим познание и действие.',
        style: 'analytical',
        status: 'approved',
        related_categories: [categoryIds.practice, categoryIds.consciousness],
        generation_parameters: {
          source: 'manual',
          author: 'test_seed'
        },
        claude_generation_id: null,
        metadata: {
          keywords: ['практика', 'этика', 'преобразование'],
          references: ['Marx']
        },
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      },
      {
        thesis_id: '850e8400-e29b-41d4-a716-446655440006',
        concept_id: conceptId,
        type: 'political',
        content: 'Философы лишь различным образом объясняли мир, но дело заключается в том, чтобы изменить его.',
        style: 'aphoristic',
        status: 'approved',
        related_categories: [categoryIds.practice],
        generation_parameters: {
          source: 'manual',
          author: 'test_seed'
        },
        claude_generation_id: null,
        metadata: {
          keywords: ['изменение', 'практика', 'философия'],
          references: ['Marx', 'Theses on Feuerbach']
        },
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      },
      {
        thesis_id: '850e8400-e29b-41d4-a716-446655440007',
        concept_id: conceptId,
        type: 'synthetic',
        content: 'Диалектический материализм представляет собой целостное мировоззрение, объединяющее материалистическое понимание природы с диалектическим методом познания и революционной практикой преобразования действительности.',
        style: 'academic',
        status: 'approved',
        related_categories: [categoryIds.matter, categoryIds.dialectics, categoryIds.practice],
        generation_parameters: {
          source: 'manual',
          author: 'test_seed'
        },
        claude_generation_id: null,
        metadata: {
          keywords: ['мировоззрение', 'целостность', 'преобразование'],
          references: ['Marx', 'Engels', 'Lenin']
        },
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      },
      {
        thesis_id: '850e8400-e29b-41d4-a716-446655440008',
        concept_id: conceptId,
        type: 'critical',
        content: 'Критика идеализма выявляет его неспособность объяснить происхождение сознания из материальных условий и практической деятельности человека.',
        style: 'dialectical',
        status: 'approved',
        related_categories: [categoryIds.consciousness, categoryIds.matter, categoryIds.practice],
        generation_parameters: {
          source: 'manual',
          author: 'test_seed'
        },
        claude_generation_id: null,
        metadata: {
          keywords: ['критика', 'идеализм', 'материализм'],
          references: ['Engels', 'Ludwig Feuerbach']
        },
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      }
    ];
    
    // Insert test theses
    const result = await thesesCollection.insertMany(testTheses);
    console.log(`Successfully inserted ${result.insertedCount} test theses`);
    
    // Create category descriptions for the test data
    const categoryDescriptionsCollection = db.collection('categoryDescriptions');
    
    const categoryDescriptions = [
      {
        description_id: '950e8400-e29b-41d4-a716-446655440001',
        category_id: categoryIds.matter,
        detailed_description: 'Материя в диалектическом материализме понимается как объективная реальность, данная человеку в ощущениях, которая копируется, фотографируется, отображается нашими ощущениями, существуя независимо от них.',
        alternative_interpretations: [
          'Физическая субстанция, из которой состоит вселенная',
          'Философская категория для обозначения объективной реальности'
        ],
        historical_analogues: [
          { concept: 'Субстанция', philosopher: 'Спиноза' },
          { concept: 'Атомы', philosopher: 'Демокрит' }
        ],
        related_concepts: [
          { concept: 'Бытие', relation: 'более общее понятие' },
          { concept: 'Природа', relation: 'частное проявление' }
        ],
        claude_generation_id: null,
        created_at: new Date('2024-01-01'),
        last_modified: new Date('2024-01-01')
      },
      {
        description_id: '950e8400-e29b-41d4-a716-446655440002',
        category_id: categoryIds.dialectics,
        detailed_description: 'Диалектика есть учение о развитии в его наиболее полном, глубоком и свободном от односторонности виде, учение об относительности человеческого знания, дающего нам отражение вечно развивающейся материи.',
        alternative_interpretations: [
          'Метод мышления через противоречия',
          'Теория развития через единство и борьбу противоположностей'
        ],
        historical_analogues: [
          { concept: 'Диалектика', philosopher: 'Гераклит' },
          { concept: 'Диалектика', philosopher: 'Гегель' }
        ],
        related_concepts: [
          { concept: 'Метафизика', relation: 'противоположный метод' },
          { concept: 'Развитие', relation: 'основное содержание' }
        ],
        claude_generation_id: null,
        created_at: new Date('2024-01-01'),
        last_modified: new Date('2024-01-01')
      }
    ];
    
    // Insert category descriptions
    const descResult = await categoryDescriptionsCollection.insertMany(categoryDescriptions);
    console.log(`Successfully inserted ${descResult.insertedCount} category descriptions`);
    
    console.log('Test theses seed completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error seeding test theses:', error);
    return { success: false, error: error.message };
  }
}

// Export the seed function
module.exports = seedTestTheses;
