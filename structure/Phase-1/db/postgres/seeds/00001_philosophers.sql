-- Seed data for philosophers table
-- Contains a selection of influential philosophers throughout history

BEGIN;

-- Insert Ancient Greek philosophers
INSERT INTO philosophers (philosopher_id, name, birth_year, death_year, description, traditions)
VALUES 
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Socrates', -470, -399, 
   'Classical Greek philosopher credited as the founder of Western philosophy. Known for the Socratic method and his student Plato.', 
   '["ancient_greek"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d480', 'Plato', -428, -348, 
   'Ancient Greek philosopher, student of Socrates and teacher of Aristotle. Founder of the Academy in Athens.', 
   '["ancient_greek"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d481', 'Aristotle', -384, -322, 
   'Ancient Greek philosopher and polymath who founded the Peripatetic school of philosophy. Tutored Alexander the Great.', 
   '["ancient_greek"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d482', 'Epicurus', -341, -270, 
   'Ancient Greek philosopher and founder of Epicureanism, which emphasized seeking modest pleasures to attain tranquility and freedom from fear.', 
   '["ancient_greek"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d483', 'Zeno of Citium', -334, -262, 
   'Founder of the Stoic school of philosophy, which taught that virtue, the highest good, is based on knowledge.', 
   '["ancient_greek"]');

-- Insert Medieval philosophers
INSERT INTO philosophers (philosopher_id, name, birth_year, death_year, description, traditions)
VALUES 
  ('f47ac10b-58cc-4372-a567-0e02b2c3d484', 'Augustine of Hippo', 354, 430, 
   'Early Christian theologian and philosopher whose writings influenced the development of Western Christianity and philosophy.', 
   '["medieval", "christian"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d485', 'Thomas Aquinas', 1225, 1274, 
   'Italian Dominican friar, philosopher, and theologian who synthesized Aristotelian philosophy with Christianity.', 
   '["medieval", "christian"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d486', 'Ibn Sina (Avicenna)', 980, 1037, 
   'Persian polymath regarded as one of the most significant physicians, astronomers, and philosophers of the Islamic Golden Age.', 
   '["medieval", "islamic"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d487', 'Ibn Rushd (Averroes)', 1126, 1198, 
   'Medieval Andalusian polymath who wrote extensively on philosophy, astronomy, psychology, physics, and Islamic law.', 
   '["medieval", "islamic"]');

-- Insert Early Modern philosophers
INSERT INTO philosophers (philosopher_id, name, birth_year, death_year, description, traditions)
VALUES 
  ('f47ac10b-58cc-4372-a567-0e02b2c3d488', 'René Descartes', 1596, 1650, 
   'French philosopher, mathematician, and scientist, often called the father of modern Western philosophy.', 
   '["early_modern", "rationalism"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d489', 'Baruch Spinoza', 1632, 1677, 
   'Dutch philosopher of Portuguese Sephardi origin who laid the groundwork for the Enlightenment and modern biblical criticism.', 
   '["early_modern", "rationalism"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d490', 'John Locke', 1632, 1704, 
   'English philosopher and physician regarded as one of the most influential of Enlightenment thinkers and the Father of Liberalism.', 
   '["early_modern", "empiricism"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d491', 'David Hume', 1711, 1776, 
   'Scottish Enlightenment philosopher, historian, economist, and essayist known for his empiricism and skepticism.', 
   '["early_modern", "empiricism"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d492', 'Immanuel Kant', 1724, 1804, 
   'German philosopher who is a central figure in modern philosophy, synthesizing early modern rationalism and empiricism.', 
   '["early_modern", "german_idealism"]');

-- Insert Modern philosophers
INSERT INTO philosophers (philosopher_id, name, birth_year, death_year, description, traditions)
VALUES 
  ('f47ac10b-58cc-4372-a567-0e02b2c3d493', 'Georg Wilhelm Friedrich Hegel', 1770, 1831, 
   'German philosopher who developed a dialectical scheme emphasizing the progress of history and ideas.', 
   '["modern", "german_idealism"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d494', 'Arthur Schopenhauer', 1788, 1860, 
   'German philosopher known for pessimism and philosophical clarity, focusing on ethics, aesthetics, and metaphysics.', 
   '["modern", "german_idealism"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d495', 'Søren Kierkegaard', 1813, 1855, 
   'Danish philosopher, theologian, and cultural critic who is widely considered to be the first existentialist philosopher.', 
   '["modern", "existentialism"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d496', 'Friedrich Nietzsche', 1844, 1900, 
   'German philosopher, cultural critic, poet, and philologist whose work has exerted a profound influence on modern intellectual history.', 
   '["modern", "existentialism"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d497', 'Karl Marx', 1818, 1883, 
   'German philosopher, economist, historian, sociologist, political theorist, and revolutionary socialist.', 
   '["modern", "marxism"]');

-- Insert Contemporary philosophers
INSERT INTO philosophers (philosopher_id, name, birth_year, death_year, description, traditions)
VALUES 
  ('f47ac10b-58cc-4372-a567-0e02b2c3d498', 'Bertrand Russell', 1872, 1970, 
   'British philosopher, logician, mathematician, historian, writer, social critic, political activist, and Nobel laureate.', 
   '["contemporary", "analytic"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d499', 'Ludwig Wittgenstein', 1889, 1951, 
   'Austrian-British philosopher who worked primarily in logic, the philosophy of mathematics, the philosophy of mind, and the philosophy of language.', 
   '["contemporary", "analytic"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d500', 'Jean-Paul Sartre', 1905, 1980, 
   'French philosopher, playwright, novelist, screenwriter, political activist, biographer, and literary critic, associated with existentialism.', 
   '["contemporary", "existentialism", "continental"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d501', 'Simone de Beauvoir', 1908, 1986, 
   'French writer, intellectual, existentialist philosopher, political activist, feminist, and social theorist.', 
   '["contemporary", "existentialism", "continental", "feminism"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d502', 'Michel Foucault', 1926, 1984, 
   'French philosopher, historian of ideas, social theorist, and literary critic, associated with structuralism and post-structuralism.', 
   '["contemporary", "postmodern", "continental"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d503', 'Judith Butler', 1956, NULL, 
   'American philosopher and gender theorist whose work has influenced political philosophy, ethics, and the fields of third-wave feminism and queer theory.', 
   '["contemporary", "continental", "feminism"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d504', 'Noam Chomsky', 1928, NULL, 
   'American linguist, philosopher, cognitive scientist, historian, social critic, and political activist, often referred to as "the father of modern linguistics".', 
   '["contemporary", "analytic"]');

-- Insert Eastern philosophers
INSERT INTO philosophers (philosopher_id, name, birth_year, death_year, description, traditions)
VALUES 
  ('f47ac10b-58cc-4372-a567-0e02b2c3d505', 'Confucius', -551, -479, 
   'Chinese philosopher and politician of the Spring and Autumn period who was traditionally considered the paragon of Chinese sages.', 
   '["eastern", "confucianism"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d506', 'Laozi', -601, -531, 
   'Ancient Chinese philosopher and writer, credited with the authorship of the Tao Te Ching and the founder of philosophical Taoism.', 
   '["eastern", "taoism"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d507', 'Siddhartha Gautama (Buddha)', -563, -483, 
   'Spiritual teacher who founded Buddhism and is considered the Supreme Buddha of our age.', 
   '["eastern", "buddhism"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d508', 'Nagarjuna', 150, 250, 
   'Indian Mahayana Buddhist philosopher who founded the Madhyamaka school of Buddhism.', 
   '["eastern", "buddhism"]');

-- Insert African philosophers
INSERT INTO philosophers (philosopher_id, name, birth_year, death_year, description, traditions)
VALUES 
  ('f47ac10b-58cc-4372-a567-0e02b2c3d509', 'Anton Wilhelm Amo', 1703, 1759, 
   'Ghanaian-German philosopher and academic from the Akan region who was the first African to attend and teach at a European university.', 
   '["african", "early_modern"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d510', 'Kwasi Wiredu', 1931, 2022, 
   'Ghanaian philosopher who emphasized the importance of African philosophical ideas and conceptual frameworks.', 
   '["african", "contemporary"]'),
   
  ('f47ac10b-58cc-4372-a567-0e02b2c3d511', 'Léopold Sédar Senghor', 1906, 2001, 
   'Senegalese poet, politician, and cultural theorist who was the first president of Senegal and a founder of the Négritude movement.', 
   '["african", "contemporary"]');

COMMIT;
