export type MotifDifficulty = "easy" | "medium" | "hard" | "artist";

export type MotifCategory =
  | "object"
  | "animal"
  | "food"
  | "nature"
  | "vehicle"
  | "place"
  | "fantasy"
  | "action"
  | "scene"
  | "emotion"
  | "composition"
  | "funny";

export type MotifSeed = {
  name: string;
  hint: string;
  difficulty: MotifDifficulty;
  category: MotifCategory;
};

export const BORING_MOTIFS = [
  "apple", "banana", "book", "key", "ball", "tree", "house", "car",
  "sun", "cup", "fish", "star", "cat", "dog",
];

export const UNSAFE_KEYWORDS = [
  "nazi", "swastika", "hitler", "porn", "nude", "sexual",
  "naked", "blood", "gore", "drug", "cocaine", "heroin",
  "gun", "rifle", "pistol", "knife", "weapon", "bomb",
  "isis", "terror", "kill", "murder", "suicide",
  "spider-man", "spiderman", "batman", "mario", "pikachu",
  "minecraft", "fortnite", "disney", "mickey", "pokemon",
  "taylor swift", "trump", "biden", "putin", "obama",
  "cigarette", "vape", "tobacco",
];

export const CASUAL_MOTIFS: MotifSeed[] = [
  { name: "Rocket", hint: "pointy rocket with flames", difficulty: "easy", category: "vehicle" },
  { name: "Cactus", hint: "spiky plant in a pot", difficulty: "easy", category: "nature" },
  { name: "Ghost", hint: "wavy white ghost with eyes", difficulty: "easy", category: "fantasy" },
  { name: "Robot", hint: "square robot with antennas", difficulty: "medium", category: "object" },
  { name: "Ice Cream Cone", hint: "scoop on a cone", difficulty: "easy", category: "food" },
  { name: "Sleeping Cat", hint: "curled-up cat with closed eyes", difficulty: "medium", category: "animal" },
  { name: "Pirate Ship", hint: "ship with skull flag", difficulty: "hard", category: "vehicle" },
  { name: "Treasure Chest", hint: "chest with gold coins", difficulty: "medium", category: "object" },
  { name: "Magic Wand", hint: "thin wand with star", difficulty: "easy", category: "object" },
  { name: "Rain Cloud", hint: "cloud with raindrops", difficulty: "easy", category: "nature" },
  { name: "Tiny Monster", hint: "fuzzy creature with horns", difficulty: "medium", category: "funny" },
  { name: "Hot Air Balloon", hint: "balloon with basket", difficulty: "medium", category: "vehicle" },
  { name: "Penguin", hint: "round penguin standing up", difficulty: "easy", category: "animal" },
  { name: "Bee", hint: "yellow bee with stripes", difficulty: "easy", category: "animal" },
  { name: "Dragon", hint: "small dragon with wings", difficulty: "hard", category: "fantasy" },
  { name: "Snail", hint: "snail with spiral shell", difficulty: "easy", category: "animal" },
  { name: "Frog", hint: "frog on a lily pad", difficulty: "easy", category: "animal" },
  { name: "Crab", hint: "crab with big claws", difficulty: "medium", category: "animal" },
  { name: "Octopus", hint: "octopus with curly arms", difficulty: "medium", category: "animal" },
  { name: "Mermaid", hint: "mermaid with long hair", difficulty: "hard", category: "fantasy" },
  { name: "Unicorn", hint: "horse with one horn", difficulty: "medium", category: "fantasy" },
  { name: "Wizard", hint: "wizard with hat and beard", difficulty: "hard", category: "fantasy" },
  { name: "Witch Hat", hint: "pointy hat with band", difficulty: "easy", category: "object" },
  { name: "Pumpkin", hint: "carved pumpkin face", difficulty: "easy", category: "object" },
  { name: "Snowman", hint: "three round snow balls", difficulty: "easy", category: "object" },
  { name: "Igloo", hint: "round ice house", difficulty: "easy", category: "place" },
  { name: "Lighthouse", hint: "tower by the sea", difficulty: "medium", category: "place" },
  { name: "Volcano", hint: "mountain with lava", difficulty: "medium", category: "nature" },
  { name: "Rainbow", hint: "arched rainbow with cloud", difficulty: "easy", category: "nature" },
  { name: "Lightning Bolt", hint: "jagged zigzag bolt", difficulty: "easy", category: "nature" },
  { name: "Mountain", hint: "two peaks with snow", difficulty: "easy", category: "nature" },
  { name: "Camping Tent", hint: "triangle tent and fire", difficulty: "medium", category: "object" },
  { name: "Campfire", hint: "logs with flames", difficulty: "easy", category: "object" },
  { name: "Spaceship", hint: "saucer with lights", difficulty: "medium", category: "vehicle" },
  { name: "Astronaut", hint: "astronaut helmet and suit", difficulty: "hard", category: "object" },
  { name: "Planet Saturn", hint: "planet with rings", difficulty: "easy", category: "place" },
  { name: "Moon", hint: "crescent moon", difficulty: "easy", category: "place" },
  { name: "Submarine", hint: "long sub with periscope", difficulty: "medium", category: "vehicle" },
  { name: "Sailboat", hint: "boat with triangle sail", difficulty: "easy", category: "vehicle" },
  { name: "Hot Dog", hint: "sausage in a bun", difficulty: "easy", category: "food" },
  { name: "Hamburger", hint: "stacked burger with cheese", difficulty: "medium", category: "food" },
  { name: "Pizza Slice", hint: "triangle with toppings", difficulty: "easy", category: "food" },
  { name: "Donut", hint: "ring with sprinkles", difficulty: "easy", category: "food" },
  { name: "Cupcake", hint: "cupcake with swirl frosting", difficulty: "medium", category: "food" },
  { name: "Sushi Roll", hint: "round roll on plate", difficulty: "medium", category: "food" },
  { name: "Taco", hint: "folded taco with filling", difficulty: "medium", category: "food" },
  { name: "Strawberry", hint: "red berry with leaves", difficulty: "easy", category: "food" },
  { name: "Watermelon Slice", hint: "wedge with seeds", difficulty: "easy", category: "food" },
  { name: "Coffee Cup", hint: "mug with steam", difficulty: "easy", category: "object" },
  { name: "Teapot", hint: "round teapot with spout", difficulty: "medium", category: "object" },
  { name: "Birthday Cake", hint: "cake with candles", difficulty: "medium", category: "food" },
  { name: "Present Box", hint: "box with ribbon and bow", difficulty: "easy", category: "object" },
  { name: "Balloon Bunch", hint: "three balloons on strings", difficulty: "easy", category: "object" },
  { name: "Kite", hint: "diamond kite with tail", difficulty: "easy", category: "object" },
  { name: "Skateboard", hint: "board with wheels", difficulty: "easy", category: "vehicle" },
  { name: "Bicycle", hint: "two wheels and handlebars", difficulty: "hard", category: "vehicle" },
  { name: "Roller Skate", hint: "boot with four wheels", difficulty: "medium", category: "object" },
  { name: "Football", hint: "oval ball with laces", difficulty: "easy", category: "object" },
  { name: "Soccer Ball", hint: "ball with hex pattern", difficulty: "easy", category: "object" },
  { name: "Basketball Hoop", hint: "hoop with net", difficulty: "medium", category: "object" },
  { name: "Surfboard", hint: "long board with stripe", difficulty: "easy", category: "object" },
  { name: "Beach Umbrella", hint: "striped umbrella in sand", difficulty: "easy", category: "object" },
  { name: "Sandcastle", hint: "sand tower with flag", difficulty: "medium", category: "object" },
  { name: "Cactus Flower", hint: "cactus with single flower", difficulty: "easy", category: "nature" },
  { name: "Sunflower", hint: "big flower with seeds", difficulty: "easy", category: "nature" },
  { name: "Mushroom", hint: "dotted toadstool", difficulty: "easy", category: "nature" },
  { name: "Acorn", hint: "acorn with cap", difficulty: "easy", category: "nature" },
  { name: "Maple Leaf", hint: "pointed leaf", difficulty: "easy", category: "nature" },
  { name: "Pinecone", hint: "scaly pinecone", difficulty: "medium", category: "nature" },
  { name: "Snail Trail", hint: "snail with sparkle trail", difficulty: "medium", category: "scene" },
  { name: "Bumblebee", hint: "fat striped bee", difficulty: "easy", category: "animal" },
  { name: "Ladybug", hint: "red bug with spots", difficulty: "easy", category: "animal" },
  { name: "Butterfly", hint: "wings with patterns", difficulty: "medium", category: "animal" },
  { name: "Dragonfly", hint: "long body with four wings", difficulty: "medium", category: "animal" },
  { name: "Owl", hint: "owl with big round eyes", difficulty: "medium", category: "animal" },
  { name: "Fox", hint: "fox with pointy ears", difficulty: "medium", category: "animal" },
  { name: "Hedgehog", hint: "spiky little hedgehog", difficulty: "medium", category: "animal" },
  { name: "Sleeping Bear", hint: "bear curled in a den", difficulty: "hard", category: "animal" },
  { name: "Whale", hint: "whale with water spout", difficulty: "easy", category: "animal" },
  { name: "Shark Fin", hint: "fin above water", difficulty: "easy", category: "animal" },
  { name: "Jellyfish", hint: "jellyfish with tentacles", difficulty: "medium", category: "animal" },
  { name: "Starfish", hint: "five-point starfish", difficulty: "easy", category: "animal" },
  { name: "Seahorse", hint: "curly seahorse", difficulty: "medium", category: "animal" },
  { name: "Turtle", hint: "turtle with patterned shell", difficulty: "medium", category: "animal" },
  { name: "Chameleon", hint: "chameleon with curly tail", difficulty: "hard", category: "animal" },
  { name: "Bat", hint: "bat with spread wings", difficulty: "easy", category: "animal" },
  { name: "Spider Web", hint: "round spider web", difficulty: "easy", category: "object" },
  { name: "Cauldron", hint: "pot with bubbling potion", difficulty: "medium", category: "object" },
  { name: "Crystal Ball", hint: "glowing ball on stand", difficulty: "medium", category: "object" },
  { name: "Spellbook", hint: "open book with sparkles", difficulty: "medium", category: "object" },
  { name: "Genie Lamp", hint: "curvy oil lamp", difficulty: "medium", category: "object" },
  { name: "Compass", hint: "compass with needle", difficulty: "medium", category: "object" },
  { name: "Hourglass", hint: "hourglass with sand", difficulty: "medium", category: "object" },
  { name: "Pocket Watch", hint: "round watch on chain", difficulty: "hard", category: "object" },
  { name: "Vinyl Record", hint: "round record with hole", difficulty: "easy", category: "object" },
  { name: "Headphones", hint: "headphones with cord", difficulty: "medium", category: "object" },
  { name: "Guitar", hint: "acoustic guitar shape", difficulty: "hard", category: "object" },
  { name: "Trumpet", hint: "brass trumpet", difficulty: "hard", category: "object" },
  { name: "Drum", hint: "snare drum with sticks", difficulty: "medium", category: "object" },
  { name: "Music Note", hint: "single quaver note", difficulty: "easy", category: "object" },
  { name: "Sneaker", hint: "high-top sneaker", difficulty: "medium", category: "object" },
  { name: "Top Hat", hint: "tall hat with band", difficulty: "easy", category: "object" },
  { name: "Crown", hint: "crown with jewels", difficulty: "medium", category: "object" },
  { name: "Bowtie", hint: "fancy bowtie", difficulty: "easy", category: "object" },
  { name: "Sunglasses", hint: "round sunglasses", difficulty: "easy", category: "object" },
  { name: "Backpack", hint: "backpack with straps", difficulty: "medium", category: "object" },
  { name: "Umbrella", hint: "open umbrella with handle", difficulty: "easy", category: "object" },
  { name: "Lantern", hint: "paper lantern", difficulty: "easy", category: "object" },
  { name: "Cherry Pair", hint: "two cherries with stems", difficulty: "easy", category: "food" },
  { name: "Pineapple", hint: "pineapple with leaves", difficulty: "medium", category: "food" },
  { name: "Lollipop", hint: "round lollipop with stick", difficulty: "easy", category: "food" },
  { name: "Popsicle", hint: "popsicle on a stick", difficulty: "easy", category: "food" },
  { name: "Croissant", hint: "crescent croissant", difficulty: "medium", category: "food" },
  { name: "Pretzel", hint: "twisted pretzel knot", difficulty: "medium", category: "food" },
  { name: "Egg Cup", hint: "egg in egg cup", difficulty: "easy", category: "food" },
  { name: "Fortune Cookie", hint: "folded fortune cookie", difficulty: "medium", category: "food" },
  { name: "Train Engine", hint: "locomotive with smoke", difficulty: "hard", category: "vehicle" },
  { name: "Airplane", hint: "small plane with wings", difficulty: "medium", category: "vehicle" },
  { name: "Helicopter", hint: "helicopter with rotor", difficulty: "hard", category: "vehicle" },
  { name: "Tractor", hint: "tractor with big tires", difficulty: "hard", category: "vehicle" },
  { name: "Bus", hint: "long bus with windows", difficulty: "medium", category: "vehicle" },
  { name: "Lighthouse Beam", hint: "lighthouse shining at night", difficulty: "hard", category: "scene" },
  { name: "Fishing Boat", hint: "boat with fishing rod", difficulty: "medium", category: "vehicle" },
  { name: "Windmill", hint: "windmill with blades", difficulty: "medium", category: "object" },
  { name: "Castle", hint: "castle with towers", difficulty: "hard", category: "place" },
  { name: "Treehouse", hint: "wooden house in a tree", difficulty: "hard", category: "place" },
  { name: "Tent Glow", hint: "tent glowing at night", difficulty: "medium", category: "scene" },
  { name: "Fox Tail", hint: "bushy fox tail", difficulty: "easy", category: "animal" },
];

export const ARTIST_MOTIFS: MotifSeed[] = [
  { name: "Melting Clock", hint: "soft clock bending over an edge", difficulty: "artist", category: "composition" },
  { name: "Tiny Robot Cafe", hint: "small robot serving a cup", difficulty: "artist", category: "scene" },
  { name: "Dragon Teapot", hint: "teapot shaped like a dragon", difficulty: "artist", category: "fantasy" },
  { name: "Floating Island", hint: "small island with tree in the sky", difficulty: "artist", category: "scene" },
  { name: "Neon Jellyfish", hint: "glowing jellyfish with long tentacles", difficulty: "artist", category: "animal" },
  { name: "Rainy Street Lamp", hint: "lamp glowing in rain", difficulty: "artist", category: "scene" },
  { name: "Crystal Mushroom", hint: "mushroom made of shiny crystals", difficulty: "artist", category: "nature" },
  { name: "Space Turtle", hint: "turtle floating with stars", difficulty: "artist", category: "animal" },
  { name: "Cozy Wizard Desk", hint: "desk with hat, candle, and book", difficulty: "artist", category: "scene" },
  { name: "Clockwork Bird", hint: "bird with gears and wings", difficulty: "artist", category: "animal" },
  { name: "Moonlit Lighthouse", hint: "lighthouse under moon and waves", difficulty: "artist", category: "scene" },
  { name: "Cyberpunk Flower", hint: "flower with wires and neon petals", difficulty: "artist", category: "nature" },
  { name: "Origami Dragon", hint: "paper dragon with folded wings", difficulty: "artist", category: "fantasy" },
  { name: "Ghost Orchestra", hint: "ghosts playing tiny instruments", difficulty: "artist", category: "funny" },
  { name: "Underwater Castle", hint: "castle with bubbles and fish", difficulty: "artist", category: "scene" },
  { name: "Lantern Fox", hint: "fox carrying a glowing lantern", difficulty: "artist", category: "animal" },
  { name: "Cloud Library", hint: "bookshelves floating in clouds", difficulty: "artist", category: "scene" },
  { name: "Tea Cup Planet", hint: "tiny planet inside a teacup", difficulty: "artist", category: "composition" },
  { name: "Mechanical Butterfly", hint: "butterfly wings with gears", difficulty: "artist", category: "animal" },
  { name: "Dream Aquarium", hint: "fish swimming through stars", difficulty: "artist", category: "scene" },
  { name: "Forest Spirit", hint: "antlered spirit between trees", difficulty: "artist", category: "fantasy" },
  { name: "Steampunk Owl", hint: "owl with brass and gears", difficulty: "artist", category: "animal" },
  { name: "Sleeping Volcano", hint: "volcano with face dreaming", difficulty: "artist", category: "composition" },
  { name: "Candle Garden", hint: "candles growing like flowers", difficulty: "artist", category: "composition" },
  { name: "Whale in the Sky", hint: "whale swimming above clouds", difficulty: "artist", category: "scene" },
  { name: "Ink Octopus", hint: "octopus splashing ink rings", difficulty: "artist", category: "animal" },
  { name: "Music Box Ballerina", hint: "ballerina on a tiny stage", difficulty: "artist", category: "scene" },
  { name: "Mountain Train", hint: "train winding through peaks", difficulty: "artist", category: "scene" },
  { name: "Tea Room Cat", hint: "cat asleep on a stack of cups", difficulty: "artist", category: "scene" },
  { name: "Mushroom Village", hint: "houses inside giant mushrooms", difficulty: "artist", category: "place" },
  { name: "Falling Star Catcher", hint: "person catching stars in a jar", difficulty: "artist", category: "scene" },
  { name: "Jellyfish Lantern", hint: "lantern shaped like a jellyfish", difficulty: "artist", category: "fantasy" },
  { name: "Snow Globe City", hint: "tiny city inside a globe", difficulty: "artist", category: "composition" },
  { name: "Coffee Wave", hint: "wave crashing out of a cup", difficulty: "artist", category: "composition" },
  { name: "Cosmic Whale", hint: "whale made of galaxies", difficulty: "artist", category: "fantasy" },
  { name: "Lava Geode", hint: "rock cracked open with lava inside", difficulty: "artist", category: "nature" },
  { name: "Frost Wolf", hint: "wolf with icy fur", difficulty: "artist", category: "animal" },
  { name: "Lantern Festival", hint: "many lanterns floating in sky", difficulty: "artist", category: "scene" },
  { name: "Tea Forest", hint: "trees made of teacups and steam", difficulty: "artist", category: "scene" },
  { name: "Sushi Sumo", hint: "sumo sushi rolls wrestling", difficulty: "artist", category: "funny" },
  { name: "Library Dragon", hint: "dragon coiled around books", difficulty: "artist", category: "fantasy" },
  { name: "Galaxy Snail", hint: "snail with a starry shell", difficulty: "artist", category: "animal" },
  { name: "Reading Robot", hint: "robot reading by candlelight", difficulty: "artist", category: "scene" },
  { name: "Sky Whale Rider", hint: "child riding a flying whale", difficulty: "artist", category: "scene" },
  { name: "Sunset Train", hint: "train passing in front of sunset", difficulty: "artist", category: "scene" },
  { name: "Witch Kitchen", hint: "witch kitchen with potions and jars", difficulty: "artist", category: "place" },
  { name: "Glass Hummingbird", hint: "hummingbird made of stained glass", difficulty: "artist", category: "animal" },
  { name: "Ink and Cherry", hint: "ink drop blooming into cherry tree", difficulty: "artist", category: "composition" },
  { name: "Paper Crane City", hint: "city skyline made of paper cranes", difficulty: "artist", category: "scene" },
  { name: "Sleeping Mountain", hint: "mountain with sleeping face", difficulty: "artist", category: "composition" },
  { name: "Bone Garden", hint: "garden growing bones like flowers", difficulty: "artist", category: "composition" },
  { name: "Glow Worm Tunnel", hint: "tunnel lit by glow worms", difficulty: "artist", category: "place" },
  { name: "Crystal Caverns", hint: "cave filled with glowing crystals", difficulty: "artist", category: "place" },
  { name: "Astro Cat", hint: "cat in spacesuit floating", difficulty: "artist", category: "animal" },
  { name: "Magma Bird", hint: "bird with feathers of lava", difficulty: "artist", category: "animal" },
  { name: "Spider Tea Party", hint: "spiders sipping tea in a web", difficulty: "artist", category: "funny" },
  { name: "Cloud Lighthouse", hint: "lighthouse floating in clouds", difficulty: "artist", category: "scene" },
  { name: "Moss Knight", hint: "knight covered in moss and ferns", difficulty: "artist", category: "fantasy" },
  { name: "Phoenix Egg", hint: "glowing egg with flame feathers", difficulty: "artist", category: "fantasy" },
  { name: "Forest Subway", hint: "subway station deep in forest", difficulty: "artist", category: "scene" },
  { name: "Sun and Moon Bridge", hint: "bridge between sun and moon", difficulty: "artist", category: "composition" },
  { name: "Rain Train", hint: "train made of raindrops", difficulty: "artist", category: "composition" },
  { name: "Beetle Knight", hint: "armored beetle holding a tiny sword", difficulty: "artist", category: "animal" },
  { name: "Tea House on a Whale", hint: "tea house resting on a whale's back", difficulty: "artist", category: "scene" },
  { name: "Bottle Garden", hint: "tiny garden growing inside a bottle", difficulty: "artist", category: "composition" },
  { name: "Origami Forest", hint: "trees made of folded paper", difficulty: "artist", category: "scene" },
  { name: "Wisp Lantern", hint: "lantern with floating spirits", difficulty: "artist", category: "fantasy" },
  { name: "Cosmic Mushroom", hint: "mushroom with galaxy under its cap", difficulty: "artist", category: "fantasy" },
  { name: "Ink Dragon", hint: "dragon made of brushstrokes", difficulty: "artist", category: "fantasy" },
  { name: "Mushroom Tea Set", hint: "mushrooms as teapot and cups", difficulty: "artist", category: "composition" },
  { name: "Lava Tortoise", hint: "tortoise with cracked lava shell", difficulty: "artist", category: "animal" },
  { name: "Snow Lantern", hint: "lantern half buried in snow", difficulty: "artist", category: "scene" },
  { name: "Robot Garden", hint: "robot watering tiny plants", difficulty: "artist", category: "scene" },
  { name: "Moon Lantern Boat", hint: "small boat with moon-shaped lantern", difficulty: "artist", category: "scene" },
  { name: "Cat Constellation", hint: "stars forming a cat shape", difficulty: "artist", category: "composition" },
  { name: "Glass Forest", hint: "forest of glass trees", difficulty: "artist", category: "scene" },
  { name: "Rune Stone", hint: "ancient stone with glowing runes", difficulty: "artist", category: "object" },
  { name: "Fox Shrine", hint: "small shrine with fox statues", difficulty: "artist", category: "place" },
  { name: "Floating Whale Pod", hint: "small whales floating in sky", difficulty: "artist", category: "scene" },
  { name: "Coral Sky", hint: "sky shaped like coral reef", difficulty: "artist", category: "composition" },
  { name: "Tea Dragon Sleep", hint: "tiny dragon sleeping on a cup", difficulty: "artist", category: "scene" },
  { name: "Lantern Tree", hint: "tree with glowing lanterns as fruit", difficulty: "artist", category: "nature" },
  { name: "Star Smith", hint: "blacksmith hammering a star", difficulty: "artist", category: "scene" },
  { name: "Cloud Whaler", hint: "small ship hunting clouds", difficulty: "artist", category: "scene" },
  // --- Expansion batch (composition/scene/fantasy/funny heavy) ---
  { name: "Floating Library", hint: "bookshelves drifting through clouds", difficulty: "artist", category: "composition" },
  { name: "Mechanical Garden", hint: "flowers with gears and wires", difficulty: "artist", category: "scene" },
  { name: "Rainy Neon Alley", hint: "glowing signs reflected in puddles", difficulty: "artist", category: "scene" },
  { name: "Crystal Fox", hint: "fox made of shiny crystal shapes", difficulty: "artist", category: "animal" },
  { name: "Dream Train", hint: "train floating through stars", difficulty: "artist", category: "vehicle" },
  { name: "Tiny Planet Cafe", hint: "small cafe on a round planet", difficulty: "artist", category: "composition" },
  { name: "Lantern Whale", hint: "whale carrying glowing lanterns", difficulty: "artist", category: "animal" },
  { name: "Paper Dragon Parade", hint: "folded dragons flying in a parade", difficulty: "artist", category: "fantasy" },
  { name: "Clocktower Octopus", hint: "octopus wrapped around a clocktower", difficulty: "artist", category: "fantasy" },
  { name: "Moon Garden", hint: "flowers growing under a large moon", difficulty: "artist", category: "scene" },
  { name: "Underwater Bakery", hint: "bakery counter with fish and bubbles", difficulty: "artist", category: "scene" },
  { name: "Robot Painter", hint: "robot painting on a canvas", difficulty: "artist", category: "scene" },
  { name: "Starlight Lighthouse", hint: "lighthouse beam made of stars", difficulty: "artist", category: "scene" },
  { name: "Ghost Tea Party", hint: "ghosts sitting around teacups", difficulty: "artist", category: "funny" },
  { name: "Cyber Mushroom", hint: "mushroom with neon circuits", difficulty: "artist", category: "nature" },
  { name: "Dragon Lantern", hint: "lantern shaped like a dragon", difficulty: "artist", category: "fantasy" },
  { name: "Cloud Aquarium", hint: "fish swimming inside clouds", difficulty: "artist", category: "composition" },
  { name: "Melting Ice Cream Moon", hint: "moon dripping like ice cream", difficulty: "artist", category: "composition" },
  { name: "Bookstore Cat Tower", hint: "cats climbing a tower of books", difficulty: "artist", category: "scene" },
  { name: "Lava Forge Dragonling", hint: "tiny dragon hammering at a forge", difficulty: "artist", category: "scene" },
  { name: "Cherry Blossom Whale", hint: "whale with cherry-blossom skin", difficulty: "artist", category: "animal" },
  { name: "Moss Knight Cat", hint: "cat in armor sprouting moss", difficulty: "artist", category: "fantasy" },
  { name: "Star Net Fisher", hint: "figure scooping stars with a net", difficulty: "artist", category: "scene" },
  { name: "Crystal Bee Hive", hint: "hive made of glowing crystal cells", difficulty: "artist", category: "nature" },
  { name: "Volcano Tea Kettle", hint: "kettle erupting like a volcano", difficulty: "artist", category: "composition" },
  { name: "Sunken Cathedral", hint: "underwater cathedral with fish choir", difficulty: "artist", category: "place" },
  { name: "Wind-Up Sparrow", hint: "sparrow with visible clockwork inside", difficulty: "artist", category: "animal" },
  { name: "Lunar Beekeeper", hint: "beekeeper on the moon with bees", difficulty: "artist", category: "scene" },
  { name: "Rain Cloud Octopus", hint: "octopus whose tentacles drip rain", difficulty: "artist", category: "fantasy" },
  { name: "Map-Wing Butterfly", hint: "butterfly with wings of old maps", difficulty: "artist", category: "animal" },
  { name: "Crystal Tea Cup", hint: "teacup carved from a single crystal", difficulty: "artist", category: "object" },
  { name: "Mechanical Flower", hint: "flower with metal petals and gears", difficulty: "artist", category: "nature" },
  { name: "Origami Boat City", hint: "city of folded paper boats on water", difficulty: "artist", category: "scene" },
  { name: "Sleepy Iceberg Bear", hint: "bear asleep on a small iceberg", difficulty: "artist", category: "animal" },
  { name: "Library Whale Belly", hint: "library inside the belly of a whale", difficulty: "artist", category: "composition" },
  { name: "Ember Cat", hint: "cat with glowing ember markings", difficulty: "artist", category: "animal" },
  { name: "Kite Festival Dragon", hint: "long kite shaped like a flying dragon", difficulty: "artist", category: "fantasy" },
  { name: "Coral Submarine", hint: "submarine covered in living coral", difficulty: "artist", category: "vehicle" },
  { name: "Spider Lantern Garden", hint: "spider hanging glowing lanterns on a web", difficulty: "artist", category: "scene" },
  { name: "Sunflower Robot", hint: "robot with a sunflower face turning to the sun", difficulty: "artist", category: "funny" },
];

function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function notRecent(seed: MotifSeed, recent: string[]): boolean {
  const norm = seed.name.trim().toLowerCase();
  return !recent.some((r) => r.trim().toLowerCase() === norm);
}

function notBoring(seed: MotifSeed): boolean {
  const norm = seed.name.trim().toLowerCase();
  return !BORING_MOTIFS.includes(norm);
}

function tokensOf(name: string): string[] {
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 3);
}

export function isTooSimilarToRecent(name: string, recentMotifs: string[]): boolean {
  const tokens = tokensOf(name);
  if (tokens.length === 0) return false;
  return recentMotifs.some((recent) => {
    const recentTokens = tokensOf(recent);
    return tokens.some((t) => recentTokens.includes(t));
  });
}

type ScoreOptions = {
  recentMotifs: string[];
  recentCategories: string[];
  artistMode: boolean;
};

function scoreMotifCandidate(motif: MotifSeed, options: ScoreOptions): number {
  let score = 100;

  if (!notRecent(motif, options.recentMotifs)) score -= 1000;

  if (options.recentCategories.includes(motif.category)) score -= 25;

  if (isTooSimilarToRecent(motif.name, options.recentMotifs)) {
    score -= options.artistMode ? 70 : 25;
  }

  if (!notBoring(motif)) score -= options.artistMode ? 100 : 40;

  if (options.artistMode) {
    if (motif.difficulty === "artist") score += 40;
    else if (motif.difficulty === "hard") score += 25;
    else if (motif.difficulty === "medium") score += 10;
    else if (motif.difficulty === "easy") score -= 25;

    if (motif.category === "scene" || motif.category === "composition" || motif.category === "fantasy") {
      score += 20;
    }
    if (motif.category === "object" || motif.category === "food") {
      score -= 10;
    }
  } else {
    if (motif.difficulty === "easy") score += 15;
    else if (motif.difficulty === "medium") score += 8;
    else if (motif.difficulty === "artist") score -= 80;
  }

  // Jitter so the same top-ranked candidate is not always chosen.
  score += Math.random() * 30;

  return score;
}

type ScoredCandidate = { motif: MotifSeed; score: number };

function weightedRandom(scored: ScoredCandidate[]): MotifSeed {
  if (scored.length === 0) {
    return {
      name: "Rocket",
      hint: "pointy rocket with flames",
      difficulty: "easy",
      category: "vehicle",
    };
  }
  const minScore = Math.min(...scored.map((c) => c.score));
  const weights = scored.map((c) => Math.max(1, c.score - minScore + 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < scored.length; i++) {
    r -= weights[i];
    if (r <= 0) return scored[i].motif;
  }
  return scored[scored.length - 1].motif;
}

export function pickFallbackMotif({
  recentMotifs,
  recentCategories,
  artistMode,
}: {
  recentMotifs: string[];
  recentCategories?: string[];
  artistMode: boolean;
}): MotifSeed {
  const options: ScoreOptions = {
    recentMotifs,
    recentCategories: recentCategories ?? [],
    artistMode,
  };

  const primaryPool = artistMode ? ARTIST_MOTIFS : CASUAL_MOTIFS;
  const secondaryPool = artistMode ? CASUAL_MOTIFS : ARTIST_MOTIFS;

  // Filter out exact-recent first; if everything is recent, allow them back in.
  const primaryFresh = primaryPool.filter((m) => notRecent(m, recentMotifs));
  const pool = primaryFresh.length > 0 ? primaryFresh : primaryPool;

  const scored: ScoredCandidate[] = pool.map((m) => ({
    motif: m,
    score: scoreMotifCandidate(m, options),
  }));
  scored.sort((a, b) => b.score - a.score);

  const topK = scored.slice(0, Math.min(20, scored.length));
  if (topK.length > 0 && topK[0].score > -500) {
    return weightedRandom(topK);
  }

  // Primary pool exhausted (everything recent + score-poor) — try secondary.
  const secondaryFresh = secondaryPool.filter((m) => notRecent(m, recentMotifs));
  const secondaryScored = (secondaryFresh.length > 0 ? secondaryFresh : secondaryPool).map((m) => ({
    motif: m,
    score: scoreMotifCandidate(m, options),
  }));
  secondaryScored.sort((a, b) => b.score - a.score);
  return weightedRandom(secondaryScored.slice(0, Math.min(20, secondaryScored.length)));
}
