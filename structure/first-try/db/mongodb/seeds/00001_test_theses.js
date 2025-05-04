// db/mongodb/seeds/00001_test_theses.js

module.exports = async function(db) {
  const theses = [
    {
      concept_id: "123e4567-e89b-12d3-a456-426614174000",
      type: "ontological",
      content: "Бытие есть то, что существует независимо от нашего сознания",
      related_categories: ["123e4567-e89b-12d3-a456-426614174001"],
      style: "academic",
      created_at: new Date(),
      updated_at: new Date(),
      version: 1,
      tags: ["онтология", "бытие", "сознание"]
    },
    {
      concept_id: "123e4567-e89b-12d3-a456-426614174000",
      type: "epistemological",
      content: "Познание возможно через синтез эмпирического опыта и рациональной рефлексии",
      related_categories: ["123e4567-e89b-12d3-a456-426614174002"],
      style: "academic",
      created_at: new Date(),
      updated_at: new Date(),
      version: 1,
      tags: ["эпистемология", "познание", "опыт"]
    }
  ];

  await db.collection('theses').insertMany(theses);
  console.log('Test theses inserted');
};
