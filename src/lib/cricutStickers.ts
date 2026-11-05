// src/lib/cricutStickers.ts
// Catálogo exacto de los 82 stickers del Sistema Automatizado de Etiquetas Cricut (5.3 x 5.0 cm)
import type { ProductItem } from './store';

export interface CricutStickerCatalogEntry {
  sku: string;
  contratipo: string;
  nombre: string;
  genero: 'H' | 'F' | 'U';
  marca: string;
  anio: string;
  familia: string;
  fraseOlfativa: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
}

export const CRICUT_STICKERS_CATALOG: CricutStickerCatalogEntry[] = [
  {
    "sku": "1",
    "contratipo": "FIERA",
    "nombre": "Sauvage",
    "genero": "H",
    "marca": "Dior",
    "anio": "2015",
    "familia": "Aromática Fougère",
    "fraseOlfativa": "Fresco y especiado sobre un fondo amaderado intenso.",
    "topNotes": [
      "Bergamota de Calabria",
      "Pimienta",
      "Elemí"
    ],
    "heartNotes": [
      "Pimienta de Sichuan",
      "Lavanda",
      "Geranio",
      "Vetiver"
    ],
    "baseNotes": [
      "Ambroxan",
      "Cedro",
      "Ládano",
      "Almizcle"
    ]
  },
  {
    "sku": "2",
    "contratipo": "MARINO",
    "nombre": "Bleu",
    "genero": "H",
    "marca": "Chanel",
    "anio": "2010",
    "familia": "Amaderada Aromática",
    "fraseOlfativa": "Elegante y profundo, con notas de maderas e incienso.",
    "topNotes": [
      "Pomelo",
      "Limón",
      "Menta",
      "Pimienta rosa"
    ],
    "heartNotes": [
      "Jengibre",
      "Nuez moscada",
      "Jazmín",
      "Iso E Super"
    ],
    "baseNotes": [
      "Incienso",
      "Vetiver",
      "Cedro",
      "Sándalo",
      "Pachulí"
    ]
  },
  {
    "sku": "3",
    "contratipo": "DAVID OCEAN",
    "nombre": "Acqua Di Giò",
    "genero": "H",
    "marca": "Giorgio Armani",
    "anio": "1996",
    "familia": "Aromática Acuática",
    "fraseOlfativa": "Inspirado en la frescura limpia del mar Mediterráneo.",
    "topNotes": [
      "Lima",
      "Limón",
      "Bergamota",
      "Jazmín",
      "Naranja"
    ],
    "heartNotes": [
      "Notas marinas",
      "Durazno",
      "Fresia",
      "Romero",
      "Ciclamen"
    ],
    "baseNotes": [
      "Almizcle blanco",
      "Cedro",
      "Musgo de roble",
      "Pachulí",
      "Ámbar"
    ]
  },
  {
    "sku": "4",
    "contratipo": "VIDEOCLUB",
    "nombre": "Club De Nuit Intense",
    "genero": "H",
    "marca": "Armaf",
    "anio": "2015",
    "familia": "Amaderada Especiada",
    "fraseOlfativa": "Carácter ahumado con salida cítrica y gran fijación.",
    "topNotes": [
      "Limón",
      "Piña",
      "Bergamota",
      "Grosellas negras",
      "Manzana"
    ],
    "heartNotes": [
      "Abedul",
      "Jazmín",
      "Rosa"
    ],
    "baseNotes": [
      "Almizcle",
      "Ámbar gris",
      "Pachulí",
      "Vainilla"
    ]
  },
  {
    "sku": "5",
    "contratipo": "EXPLORADOR",
    "nombre": "Aventus",
    "genero": "H",
    "marca": "Creed",
    "anio": "2010",
    "familia": "Chipre Frutal",
    "fraseOlfativa": "Un equilibrio clásico entre fruta fresca y maderas secas.",
    "topNotes": [
      "Piña",
      "Bergamota",
      "Grosellas negras",
      "Manzana"
    ],
    "heartNotes": [
      "Abedul",
      "Pachulí",
      "Jazmín de Marruecos",
      "Rosa"
    ],
    "baseNotes": [
      "Almizcle",
      "Musgo de roble",
      "Ámbar gris",
      "Vainilla"
    ]
  },
  {
    "sku": "6",
    "contratipo": "ELLA ES LINDA",
    "nombre": "La Vida Es Bella",
    "genero": "F",
    "marca": "Lancôme",
    "anio": "2012",
    "familia": "Floral Frutal Gourmand",
    "fraseOlfativa": "Dulce, floral y luminoso de principio a fin.",
    "topNotes": [
      "Grosellas negras",
      "Pera",
      "Bergamota"
    ],
    "heartNotes": [
      "Iris",
      "Jazmín",
      "Flor de azahar"
    ],
    "baseNotes": [
      "Praliné",
      "Vainilla",
      "Pachulí",
      "Haba tonka"
    ]
  },
  {
    "sku": "7",
    "contratipo": "CITRIC HEAVEN",
    "nombre": "Odyssey Mandarin Sky",
    "genero": "H",
    "marca": "Armaf",
    "anio": "2023",
    "familia": "Cítrica Ambarada",
    "fraseOlfativa": "El contraste entre un cítrico jugoso y el caramelo tibio.",
    "topNotes": [
      "Mandarina",
      "Naranja",
      "Azafrán"
    ],
    "heartNotes": [
      "Caramelo",
      "Haba tonka",
      "Tagetes"
    ],
    "baseNotes": [
      "Ambroxan",
      "Cedro",
      "Vetiver"
    ]
  },
  {
    "sku": "8",
    "contratipo": "ATREVIDO",
    "nombre": "Eros",
    "genero": "H",
    "marca": "Versace",
    "anio": "2012",
    "familia": "Aromática Fougère",
    "fraseOlfativa": "Intenso y envolvente, con el contraste de menta y vainilla.",
    "topNotes": [
      "Menta",
      "Manzana verde",
      "Limón"
    ],
    "heartNotes": [
      "Haba tonka",
      "Ambroxan",
      "Geranio"
    ],
    "baseNotes": [
      "Vainilla de Madagascar",
      "Cedro de Virginia",
      "Vetiver",
      "Musgo de roble"
    ]
  },
  {
    "sku": "9",
    "contratipo": "NIPPON",
    "nombre": "L'Eau d'Issey",
    "genero": "H",
    "marca": "Issey Miyake",
    "anio": "1994",
    "familia": "Amaderada Acuática",
    "fraseOlfativa": "Un aroma acuático tan limpio como el agua fresca.",
    "topNotes": [
      "Yuzu",
      "Limón",
      "Bergamota",
      "Mandarina"
    ],
    "heartNotes": [
      "Lirio de los valles",
      "Nuez moscada",
      "Loto azul",
      "Canela"
    ],
    "baseNotes": [
      "Vetiver de Tahití",
      "Almizcle",
      "Cedro",
      "Sándalo"
    ]
  },
  {
    "sku": "10",
    "contratipo": "NICHO Y PAPIRO",
    "nombre": "Santal 33",
    "genero": "U",
    "marca": "Le Labo",
    "anio": "2011",
    "familia": "Amaderada Aromática",
    "fraseOlfativa": "Maderas secas y un toque de cuero de estilo minimalista.",
    "topNotes": [
      "Cardamomo",
      "Violeta",
      "Papiro de Egipto"
    ],
    "heartNotes": [
      "Iris",
      "Ámbar",
      "Cedro"
    ],
    "baseNotes": [
      "Sándalo",
      "Cuero",
      "Almizcle"
    ]
  },
  {
    "sku": "11",
    "contratipo": "EUROBOY INTENSE",
    "nombre": "Born In Roma Intense",
    "genero": "H",
    "marca": "Valentino",
    "anio": "2023",
    "familia": "Ámbar Fougère",
    "fraseOlfativa": "Vainilla oscura con un fondo cálido pensado para la noche.",
    "topNotes": [
      "Vainilla de Bourbon",
      "Ámbar",
      "Bergamota"
    ],
    "heartNotes": [
      "Lavanda",
      "Salvia",
      "Notas especiadas"
    ],
    "baseNotes": [
      "Vetiver ahumado",
      "Notas amaderadas",
      "Benjuí"
    ]
  },
  {
    "sku": "12",
    "contratipo": "HIEDRAFRAIS",
    "nombre": "Erba Pura",
    "genero": "U",
    "marca": "Xerjoff",
    "anio": "2019",
    "familia": "Ámbar Frutal",
    "fraseOlfativa": "Frutas dulces del Mediterráneo sobre un fondo suave.",
    "topNotes": [
      "Naranja de Sicilia",
      "Bergamota de Calabria",
      "Limón de Sicilia"
    ],
    "heartNotes": [
      "Frutas mediterráneas",
      "Melón",
      "Pera"
    ],
    "baseNotes": [
      "Almizcle blanco",
      "Vainilla de Madagascar",
      "Ámbar"
    ]
  },
  {
    "sku": "13",
    "contratipo": "PINK LADY",
    "nombre": "Coco Mademoiselle",
    "genero": "F",
    "marca": "Chanel",
    "anio": "2001",
    "familia": "Ámbar Floral",
    "fraseOlfativa": "La elegancia clásica de la perfumería moderna de París.",
    "topNotes": [
      "Naranja",
      "Mandarina",
      "Bergamota",
      "Flor de azahar"
    ],
    "heartNotes": [
      "Rosa turca",
      "Jazmín",
      "Mimosa",
      "Ylang-ylang"
    ],
    "baseNotes": [
      "Pachulí",
      "Almizcle blanco",
      "Vainilla",
      "Vetiver",
      "Haba tonka"
    ]
  },
  {
    "sku": "14",
    "contratipo": "OCEAN LORD",
    "nombre": "Light Blue",
    "genero": "H",
    "marca": "Dolce & Gabbana",
    "anio": "2001",
    "familia": "Floral Frutal",
    "fraseOlfativa": "Pensado para días soleados y clima cálido de verano.",
    "topNotes": [
      "Limón siciliano",
      "Manzana",
      "Cedro",
      "Campanilla"
    ],
    "heartNotes": [
      "Bambú",
      "Jazmín",
      "Rosa blanca"
    ],
    "baseNotes": [
      "Cedro",
      "Almizcle",
      "Ámbar"
    ]
  },
  {
    "sku": "15",
    "contratipo": "WALLSTREET WOLF",
    "nombre": "Boss Bottled",
    "genero": "H",
    "marca": "Hugo Boss",
    "anio": "1998",
    "familia": "Amaderada Especiada",
    "fraseOlfativa": "Calidez de manzana y especias con un corte formal.",
    "topNotes": [
      "Manzana",
      "Ciruela",
      "Bergamota",
      "Limón",
      "Musgo de roble"
    ],
    "heartNotes": [
      "Canela",
      "Caoba",
      "Clavel"
    ],
    "baseNotes": [
      "Vainilla",
      "Sándalo",
      "Cedro",
      "Vetiver",
      "Olivo"
    ]
  },
  {
    "sku": "16",
    "contratipo": "KICKBOX",
    "nombre": "Invictus",
    "genero": "H",
    "marca": "Paco Rabanne",
    "anio": "2013",
    "familia": "Amaderada Acuática",
    "fraseOlfativa": "Fresco y dinámico, con un toque marino muy marcado.",
    "topNotes": [
      "Notas marinas",
      "Pomelo",
      "Mandarina"
    ],
    "heartNotes": [
      "Hoja de laurel",
      "Jazmín",
      "Hediona"
    ],
    "baseNotes": [
      "Ámbar gris",
      "Madera de gaiac",
      "Musgo de roble",
      "Pachulí"
    ]
  },
  {
    "sku": "17",
    "contratipo": "EURO HEIRESS",
    "nombre": "Burberry Her",
    "genero": "F",
    "marca": "Burberry",
    "anio": "2018",
    "familia": "Floral Frutal Gourmand",
    "fraseOlfativa": "Frutos rojos dulces con un estilo moderno y ligero.",
    "topNotes": [
      "Fresa",
      "Frambuesa",
      "Mora",
      "Cereza"
    ],
    "heartNotes": [
      "Violeta",
      "Jazmín",
      "Peonía"
    ],
    "baseNotes": [
      "Almizcle",
      "Vainilla",
      "Ámbar",
      "Cachemira"
    ]
  },
  {
    "sku": "18",
    "contratipo": "MANEATER",
    "nombre": "212 VIP Rosé",
    "genero": "F",
    "marca": "Carolina Herrera",
    "anio": "2014",
    "familia": "Floral Frutal",
    "fraseOlfativa": "Suave, frutal y con un toque festivo muy sutil.",
    "topNotes": [
      "Champán rosado",
      "Pimienta rosa",
      "Notas afrutadas"
    ],
    "heartNotes": [
      "Flor del duraznero",
      "Rosa",
      "Gardenia"
    ],
    "baseNotes": [
      "Almizcle blanco",
      "Notas amaderadas",
      "Ámbar"
    ]
  },
  {
    "sku": "19",
    "contratipo": "ELITE",
    "nombre": "Polo Blue",
    "genero": "H",
    "marca": "Ralph Lauren",
    "anio": "2003",
    "familia": "Aromática Fougère",
    "fraseOlfativa": "Un aroma limpio y despejado para usar todos los días.",
    "topNotes": [
      "Pepino",
      "Melón",
      "Mandarina"
    ],
    "heartNotes": [
      "Albahaca",
      "Salvia",
      "Geranio"
    ],
    "baseNotes": [
      "Gamuza",
      "Notas amaderadas",
      "Almizcle"
    ]
  },
  {
    "sku": "20",
    "contratipo": "RICHRICH",
    "nombre": "One Million",
    "genero": "H",
    "marca": "Paco Rabanne",
    "anio": "2008",
    "familia": "Amaderada Especiada",
    "fraseOlfativa": "Cálido y especiado, diseñado para destacar de noche.",
    "topNotes": [
      "Mandarina roja",
      "Pomelo",
      "Menta"
    ],
    "heartNotes": [
      "Canela",
      "Notas especiadas",
      "Rosa"
    ],
    "baseNotes": [
      "Ámbar",
      "Cuero",
      "Notas amaderadas",
      "Pachulí hindú"
    ]
  },
  {
    "sku": "21",
    "contratipo": "LADY MONEY",
    "nombre": "Coco",
    "genero": "F",
    "marca": "Chanel",
    "anio": "1984",
    "familia": "Ámbar Especiada",
    "fraseOlfativa": "Perfumería tradicional de especias cálidas y fondo ambarado.",
    "topNotes": [
      "Coriandro",
      "Mandarina",
      "Durazno",
      "Jazmín"
    ],
    "heartNotes": [
      "Mimosa",
      "Clavo de olor",
      "Flor de azahar",
      "Trébol blanco"
    ],
    "baseNotes": [
      "Ládano",
      "Ámbar",
      "Sándalo",
      "Haba tonka"
    ]
  },
  {
    "sku": "22",
    "contratipo": "NEW YORK LADY",
    "nombre": "Chance",
    "genero": "F",
    "marca": "Chanel",
    "anio": "2003",
    "familia": "Chipre Floral",
    "fraseOlfativa": "Floral y ligero, con un toque fresco de pimienta rosa.",
    "topNotes": [
      "Pachulí",
      "Pimienta rosa",
      "Piña",
      "Jacinto"
    ],
    "heartNotes": [
      "Limón",
      "Jazmín",
      "Rosa"
    ],
    "baseNotes": [
      "Pachulí",
      "Almizcle",
      "Vetiver",
      "Vainilla"
    ]
  },
  {
    "sku": "23",
    "contratipo": "HABIBI",
    "nombre": "9PM",
    "genero": "H",
    "marca": "Afnan",
    "anio": "2020",
    "familia": "Ámbar Vainilla",
    "fraseOlfativa": "Dulce y nocturno, cuando empieza lo mejor del día.",
    "topNotes": [
      "Manzana",
      "Canela",
      "Lavanda silvestre",
      "Bergamota"
    ],
    "heartNotes": [
      "Flor de azahar",
      "Lirio de los valles",
      "Cardamomo"
    ],
    "baseNotes": [
      "Vainilla",
      "Haba tonka",
      "Ámbar",
      "Pachulí"
    ]
  },
  {
    "sku": "24",
    "contratipo": "THE MAN",
    "nombre": "Le Male",
    "genero": "H",
    "marca": "Jean Paul Gaultier",
    "anio": "1995",
    "familia": "Ámbar Fougère",
    "fraseOlfativa": "El contraste clásico entre la lavanda limpia y la vainilla.",
    "topNotes": [
      "Lavanda",
      "Menta",
      "Cardamomo",
      "Bergamota",
      "Artemisia"
    ],
    "heartNotes": [
      "Canela",
      "Flor de azahar del naranjo",
      "Alcaravea"
    ],
    "baseNotes": [
      "Vainilla",
      "Haba tonka",
      "Ámbar",
      "Sándalo",
      "Cedro"
    ]
  },
  {
    "sku": "25",
    "contratipo": "MAGNOLIA",
    "nombre": "J'adore",
    "genero": "F",
    "marca": "Dior",
    "anio": "1999",
    "familia": "Floral Frutal",
    "fraseOlfativa": "Un ramo de flores blancas de estilo fino y luminoso.",
    "topNotes": [
      "Pera",
      "Melón",
      "Magnolia",
      "Durazno"
    ],
    "heartNotes": [
      "Jazmín",
      "Lirio de los valles",
      "Tuberosa",
      "Fresia"
    ],
    "baseNotes": [
      "Almizcle",
      "Vainilla",
      "Cedro",
      "Zarzamora"
    ]
  },
  {
    "sku": "26",
    "contratipo": "AMERICAN BOY",
    "nombre": "Tommy",
    "genero": "H",
    "marca": "Tommy Hilfiger",
    "anio": "1995",
    "familia": "Cítrica Aromática",
    "fraseOlfativa": "Fresco, juvenil y fácil de llevar a cualquier hora.",
    "topNotes": [
      "Menta",
      "Bergamota",
      "Pomelo",
      "Lavanda"
    ],
    "heartNotes": [
      "Manzana verde",
      "Arándano rojo",
      "Rosa amarilla"
    ],
    "baseNotes": [
      "Flor del algodonero",
      "Cactus",
      "Ámbar"
    ]
  },
  {
    "sku": "27",
    "contratipo": "OBERLIN",
    "nombre": "N° 5",
    "genero": "F",
    "marca": "Chanel",
    "anio": "1921",
    "familia": "Floral Aldehídica",
    "fraseOlfativa": "El icono floral más famoso en la historia del perfume.",
    "topNotes": [
      "Aldehídos",
      "Ylang-ylang",
      "Neroli",
      "Bergamota"
    ],
    "heartNotes": [
      "Iris",
      "Jazmín",
      "Rosa",
      "Raíz de lirio"
    ],
    "baseNotes": [
      "Algalia",
      "Almizcle",
      "Sándalo",
      "Ámbar"
    ]
  },
  {
    "sku": "28",
    "contratipo": "IRRESISTIBLE",
    "nombre": "Bad Boy",
    "genero": "H",
    "marca": "Carolina Herrera",
    "anio": "2019",
    "familia": "Ámbar Especiada",
    "fraseOlfativa": "Un giro moderno entre especias vibrantes y cacao tostado.",
    "topNotes": [
      "Pimienta blanca",
      "Pimienta negra",
      "Bergamota"
    ],
    "heartNotes": [
      "Salvia",
      "Cedro",
      "Romero"
    ],
    "baseNotes": [
      "Haba tonka",
      "Cacao",
      "Amberwood"
    ]
  },
  {
    "sku": "29",
    "contratipo": "CHARLI APPLE",
    "nombre": "Be Delicious",
    "genero": "F",
    "marca": "DKNY",
    "anio": "2004",
    "familia": "Floral Frutal",
    "fraseOlfativa": "Tan fresco y natural como una manzana recién cortada.",
    "topNotes": [
      "Pepino",
      "Pomelo",
      "Magnolia"
    ],
    "heartNotes": [
      "Manzana verde",
      "Lirio de los valles",
      "Tuberosa",
      "Violeta"
    ],
    "baseNotes": [
      "Notas amaderadas",
      "Sándalo",
      "Ámbar"
    ]
  },
  {
    "sku": "30",
    "contratipo": "MON CHERRY",
    "nombre": "Lost Cherry",
    "genero": "U",
    "marca": "Tom Ford",
    "anio": "2018",
    "familia": "Ámbar Floral",
    "fraseOlfativa": "El aroma profundo de la cereza negra con un fondo licoroso.",
    "topNotes": [
      "Cereza ácida",
      "Almendra amarga",
      "Licor"
    ],
    "heartNotes": [
      "Cereza ácida",
      "Ciruela",
      "Rosa turca",
      "Jazmín Sambac"
    ],
    "baseNotes": [
      "Haba tonka",
      "Vainilla",
      "Bálsamo del Perú",
      "Canela"
    ]
  },
  {
    "sku": "31",
    "contratipo": "PARTYBOY",
    "nombre": "Scandal",
    "genero": "H",
    "marca": "Jean Paul Gaultier",
    "anio": "2021",
    "familia": "Chipre Floral",
    "fraseOlfativa": "Dulce e intenso, dominado por el calor de la miel.",
    "topNotes": [
      "Naranja sanguina",
      "Mandarina",
      "Salvia"
    ],
    "heartNotes": [
      "Miel",
      "Gardenia",
      "Flor de azahar",
      "Jazmín"
    ],
    "baseNotes": [
      "Cera de abeja",
      "Caramelo",
      "Pachulí",
      "Haba tonka"
    ]
  },
  {
    "sku": "32",
    "contratipo": "EURO GIRL",
    "nombre": "Born In Roma Donna",
    "genero": "F",
    "marca": "Valentino",
    "anio": "2019",
    "familia": "Ámbar Floral",
    "fraseOlfativa": "Flores blancas combinadas con una vainilla cálida y actual.",
    "topNotes": [
      "Grosellas negras",
      "Pimienta rosa",
      "Bergamota"
    ],
    "heartNotes": [
      "Jazmín Sambac",
      "Jazmín",
      "Té de jazmín"
    ],
    "baseNotes": [
      "Vainilla Bourbon",
      "Cachemira",
      "Madera de gaiac"
    ]
  },
  {
    "sku": "33",
    "contratipo": "KING LUIS",
    "nombre": "L'Immensité",
    "genero": "H",
    "marca": "Louis Vuitton",
    "anio": "2018",
    "familia": "Ámbar Especiada",
    "fraseOlfativa": "Frescura cítrica con jengibre sobre una base ambarada limpia.",
    "topNotes": [
      "Pomelo",
      "Jengibre",
      "Bergamota"
    ],
    "heartNotes": [
      "Romero",
      "Notas acuáticas",
      "Salvia",
      "Geranio"
    ],
    "baseNotes": [
      "Ambroxan",
      "Ámbar",
      "Ládano"
    ]
  },
  {
    "sku": "34",
    "contratipo": "WIFE MATERIAL",
    "nombre": "212 VIP",
    "genero": "F",
    "marca": "Carolina Herrera",
    "anio": "2010",
    "familia": "Ámbar Vainilla",
    "fraseOlfativa": "Un aroma cálido y envolvente para ambientes nocturnos.",
    "topNotes": [
      "Ron",
      "Maracuyá",
      "Mandarina"
    ],
    "heartNotes": [
      "Gardenia",
      "Almizcle",
      "Flor de azahar"
    ],
    "baseNotes": [
      "Vainilla",
      "Haba tonka",
      "Benjuí"
    ]
  },
  {
    "sku": "35",
    "contratipo": "EURO SAMURAI",
    "nombre": "Swiss Army",
    "genero": "H",
    "marca": "Victorinox",
    "anio": "1997",
    "familia": "Amaderada Aromática",
    "fraseOlfativa": "Recuerda al aire fresco y limpio de la montaña.",
    "topNotes": [
      "Menta",
      "Notas verdes",
      "Bergamota",
      "Yuzu"
    ],
    "heartNotes": [
      "Lavanda",
      "Romero",
      "Hojas de violeta",
      "Flor de las nieves"
    ],
    "baseNotes": [
      "Ciprés",
      "Cedro",
      "Bálsamo de abeto",
      "Almizcle"
    ]
  },
  {
    "sku": "36",
    "contratipo": "BASIC WHITE",
    "nombre": "Blanc L.12.12",
    "genero": "H",
    "marca": "Lacoste",
    "anio": "2011",
    "familia": "Amaderada Aromática",
    "fraseOlfativa": "Sencillo, pulcro y fresco de la mañana a la noche.",
    "topNotes": [
      "Pomelo",
      "Romero",
      "Cardamomo"
    ],
    "heartNotes": [
      "Ylang-ylang",
      "Tuberosa",
      "Olibano"
    ],
    "baseNotes": [
      "Gamuza",
      "Cedro de Virginia",
      "Cuero",
      "Vetiver"
    ]
  },
  {
    "sku": "37",
    "contratipo": "GEORGIA ICON",
    "nombre": "Acqua Di Giò",
    "genero": "F",
    "marca": "Giorgio Armani",
    "anio": "1995",
    "familia": "Aromática Acuática",
    "fraseOlfativa": "Suave y acuático, como un jardín recién regado.",
    "topNotes": [
      "Lima",
      "Limón",
      "Bergamota",
      "Jazmín"
    ],
    "heartNotes": [
      "Notas marinas",
      "Romero",
      "Ciclamen"
    ],
    "baseNotes": [
      "Cedro",
      "Almizcle blanco",
      "Musgo de roble"
    ]
  },
  {
    "sku": "38",
    "contratipo": "NIGHT SKY",
    "nombre": "Polo Black",
    "genero": "H",
    "marca": "Ralph Lauren",
    "anio": "2005",
    "familia": "Amaderada Aromática",
    "fraseOlfativa": "Madera oscura con un toque frutal sobrio y elegante.",
    "topNotes": [
      "Mango helado",
      "Salvia",
      "Mandarina"
    ],
    "heartNotes": [
      "Artemisia",
      "Hediona",
      "Notas verdes"
    ],
    "baseNotes": [
      "Pachulí negro",
      "Sándalo",
      "Haba tonka"
    ]
  },
  {
    "sku": "39",
    "contratipo": "COWBOY GIRL",
    "nombre": "Ralph",
    "genero": "F",
    "marca": "Ralph Lauren",
    "anio": "2000",
    "familia": "Floral Frutal",
    "fraseOlfativa": "Alegre, frutal y muy fresco para el día a día.",
    "topNotes": [
      "Manzana verde",
      "Mandarina italiana",
      "Osmanto japonés"
    ],
    "heartNotes": [
      "Fresia amarilla",
      "Magnolia",
      "Boronia"
    ],
    "baseNotes": [
      "Almizcle blanco",
      "Iris",
      "Cedro blanco"
    ]
  },
  {
    "sku": "40",
    "contratipo": "DUBAI",
    "nombre": "Yara",
    "genero": "F",
    "marca": "Lattafa",
    "anio": "2020",
    "familia": "Ámbar Vainilla",
    "fraseOlfativa": "Una fragancia suave, cremosa y delicadamente dulce.",
    "topNotes": [
      "Orquídea",
      "Heliotropo",
      "Mandarina"
    ],
    "heartNotes": [
      "Acorde goloso",
      "Frutas tropicales",
      "Rosa"
    ],
    "baseNotes": [
      "Vainilla",
      "Almizcle",
      "Sándalo"
    ]
  },
  {
    "sku": "41",
    "contratipo": "BURJ KHALIFA",
    "nombre": "Yara Tous",
    "genero": "F",
    "marca": "Lattafa",
    "anio": "2023",
    "familia": "Floral Frutal Gourmand",
    "fraseOlfativa": "Notas tropicales dulces que recuerdan a días de vacaciones.",
    "topNotes": [
      "Mango",
      "Coco",
      "Maracuyá"
    ],
    "heartNotes": [
      "Jazmín",
      "Heliotropo",
      "Flor de azahar"
    ],
    "baseNotes": [
      "Vainilla",
      "Cachemira",
      "Almizcle"
    ]
  },
  {
    "sku": "42",
    "contratipo": "ATOMIC FLOWER",
    "nombre": "Flowerbomb",
    "genero": "F",
    "marca": "Viktor & Rolf",
    "anio": "2005",
    "familia": "Ámbar Floral",
    "fraseOlfativa": "Un floral abundante con un fondo dulce muy envolvente.",
    "topNotes": [
      "Té",
      "Bergamota",
      "Osmanto"
    ],
    "heartNotes": [
      "Orquídea",
      "Jazmín Sambac",
      "Rosa",
      "Fresia"
    ],
    "baseNotes": [
      "Pachulí",
      "Almizcle",
      "Vainilla"
    ]
  },
  {
    "sku": "43",
    "contratipo": "AROMA ADDICT",
    "nombre": "Black Opium",
    "genero": "F",
    "marca": "Yves Saint Laurent",
    "anio": "2014",
    "familia": "Ámbar Vainilla",
    "fraseOlfativa": "El contraste adictivo del café recién hecho y la vainilla.",
    "topNotes": [
      "Pera",
      "Pimienta rosa",
      "Flor de azahar del naranjo"
    ],
    "heartNotes": [
      "Café",
      "Jazmín",
      "Almendra amarga",
      "Regaliz"
    ],
    "baseNotes": [
      "Vainilla",
      "Pachulí",
      "Cedro",
      "Madera de cachemira"
    ]
  },
  {
    "sku": "44",
    "contratipo": "EMPERADOR",
    "nombre": "Homme Sport",
    "genero": "H",
    "marca": "Dior",
    "anio": "2008",
    "familia": "Amaderada Aromática",
    "fraseOlfativa": "Cítricos frescos sobre madera limpia de estilo deportivo.",
    "topNotes": [
      "Limón de Amalfi",
      "Pomelo",
      "Bergamota",
      "Resina de elemí"
    ],
    "heartNotes": [
      "Jengibre",
      "Vetiver",
      "Cedro de Virginia"
    ],
    "baseNotes": [
      "Lavanda",
      "Sándalo",
      "Romero"
    ]
  },
  {
    "sku": "45",
    "contratipo": "CLASSIC MAN",
    "nombre": "CK One",
    "genero": "U",
    "marca": "Calvin Klein",
    "anio": "1994",
    "familia": "Cítrica Aromática",
    "fraseOlfativa": "El clásico aroma limpio y compartido de los años noventa.",
    "topNotes": [
      "Limón",
      "Notas verdes",
      "Bergamota",
      "Piña"
    ],
    "heartNotes": [
      "Lirio de los valles",
      "Jazmín",
      "Violeta",
      "Nuez moscada"
    ],
    "baseNotes": [
      "Acorde verde",
      "Almizcle",
      "Cedro",
      "Sándalo"
    ]
  },
  {
    "sku": "46",
    "contratipo": "ENGLAND PHONE",
    "nombre": "360 Red",
    "genero": "H",
    "marca": "Perry Ellis",
    "anio": "2003",
    "familia": "Amaderada Especiada",
    "fraseOlfativa": "Fresco al inicio con un fondo cálido de especias suaves.",
    "topNotes": [
      "Lima",
      "Bergamota",
      "Canela",
      "Mandarina"
    ],
    "heartNotes": [
      "Lavanda",
      "Cilantro",
      "Cardamomo"
    ],
    "baseNotes": [
      "Almizcle",
      "Sándalo",
      "Cedro rojo",
      "Vetiver"
    ]
  },
  {
    "sku": "47",
    "contratipo": "ENGLAND FOREST",
    "nombre": "Green Tea",
    "genero": "F",
    "marca": "Elizabeth Arden",
    "anio": "1999",
    "familia": "Cítrica Aromática",
    "fraseOlfativa": "Ligero y relajante, como una infusión de té verde frío.",
    "topNotes": [
      "Limón",
      "Bergamota",
      "Menta",
      "Cáscara de naranja"
    ],
    "heartNotes": [
      "Jazmín",
      "Musgo de roble",
      "Hinojo",
      "Almizcle"
    ],
    "baseNotes": [
      "Té verde",
      "Jazmín",
      "Musgo de roble",
      "Almizcle"
    ]
  },
  {
    "sku": "48",
    "contratipo": "ROMANOV",
    "nombre": "Princess",
    "genero": "F",
    "marca": "Vera Wang",
    "anio": "2006",
    "familia": "Ámbar Floral",
    "fraseOlfativa": "Dulzura suave de chocolate blanco con un toque frutal.",
    "topNotes": [
      "Manzana",
      "Nenúfar",
      "Mandarina",
      "Albaricoque"
    ],
    "heartNotes": [
      "Chocolate negro",
      "Guayaba",
      "Tiaré",
      "Tuberosa"
    ],
    "baseNotes": [
      "Vainilla",
      "Ámbar",
      "Notas amaderadas"
    ]
  },
  {
    "sku": "49",
    "contratipo": "FIERA ELIXIR",
    "nombre": "Sauvage Elixir",
    "genero": "H",
    "marca": "Dior",
    "anio": "2021",
    "familia": "Aromática Especiada",
    "fraseOlfativa": "Concentrado, especiado y de carácter profundo en la piel.",
    "topNotes": [
      "Canela",
      "Nuez moscada",
      "Cardamomo",
      "Pomelo"
    ],
    "heartNotes": [
      "Lavanda",
      "Elemí",
      "Geranio"
    ],
    "baseNotes": [
      "Regaliz",
      "Sándalo",
      "Ámbar",
      "Pachulí",
      "Vetiver"
    ]
  },
  {
    "sku": "50",
    "contratipo": "EUROBOY",
    "nombre": "Born In Roma Uomo",
    "genero": "H",
    "marca": "Valentino",
    "anio": "2019",
    "familia": "Ámbar Amaderada",
    "fraseOlfativa": "Frescura mineral combinada con maderas secas modernas.",
    "topNotes": [
      "Notas minerales",
      "Hojas de violeta",
      "Sal"
    ],
    "heartNotes": [
      "Jengibre",
      "Salvia",
      "Lavanda"
    ],
    "baseNotes": [
      "Notas amaderadas",
      "Vetiver",
      "Madera de gaiac"
    ]
  },
  {
    "sku": "51",
    "contratipo": "DEEP OCEAN",
    "nombre": "Acqua Di Giò Profondo",
    "genero": "H",
    "marca": "Giorgio Armani",
    "anio": "2020",
    "familia": "Aromática Acuática",
    "fraseOlfativa": "El lado más profundo y mineral de las fragancias marinas.",
    "topNotes": [
      "Notas marinas",
      "Aquozone",
      "Bergamota",
      "Mandarina verde"
    ],
    "heartNotes": [
      "Romero",
      "Lavanda",
      "Ciprés",
      "Lentisco"
    ],
    "baseNotes": [
      "Notas minerales",
      "Almizcle",
      "Pachulí",
      "Ámbar"
    ]
  },
  {
    "sku": "52",
    "contratipo": "THE MAN ELIXIR",
    "nombre": "Le Male Elixir",
    "genero": "H",
    "marca": "Jean Paul Gaultier",
    "anio": "2023",
    "familia": "Ámbar Fougère",
    "fraseOlfativa": "Cálido y denso, con notas de miel y tabaco suave.",
    "topNotes": [
      "Lavanda",
      "Menta",
      "Cardamomo"
    ],
    "heartNotes": [
      "Vainilla",
      "Benjuí",
      "Canela"
    ],
    "baseNotes": [
      "Miel",
      "Haba tonka",
      "Tabaco"
    ]
  },
  {
    "sku": "53",
    "contratipo": "ALWAYS WITH YOU",
    "nombre": "Stronger With You",
    "genero": "H",
    "marca": "Giorgio Armani",
    "anio": "2017",
    "familia": "Aromática Fougère",
    "fraseOlfativa": "Un aroma dulce y tostado ideal para los días fríos.",
    "topNotes": [
      "Cardamomo",
      "Pimienta rosa",
      "Hojas de violeta",
      "Menta"
    ],
    "heartNotes": [
      "Piña",
      "Canela",
      "Melón",
      "Salvia",
      "Lavanda"
    ],
    "baseNotes": [
      "Vainilla",
      "Castaña caramelizada",
      "Cedro",
      "Madera de gaiac",
      "Amberwood"
    ]
  },
  {
    "sku": "54",
    "contratipo": "MANHATTAN",
    "nombre": "212 Men",
    "genero": "H",
    "marca": "Carolina Herrera",
    "anio": "1999",
    "familia": "Almizcle Amaderado Floral",
    "fraseOlfativa": "Verde y limpio, como el olor a pasto recién cortado.",
    "topNotes": [
      "Notas verdes",
      "Pomelo",
      "Especias",
      "Bergamota"
    ],
    "heartNotes": [
      "Jengibre",
      "Gardenia",
      "Violeta",
      "Salvia"
    ],
    "baseNotes": [
      "Almizcle",
      "Sándalo",
      "Incienso",
      "Vetiver"
    ]
  },
  {
    "sku": "55",
    "contratipo": "BLACK VOLCANO",
    "nombre": "Man In Black",
    "genero": "H",
    "marca": "Bvlgari",
    "anio": "2014",
    "familia": "Ámbar Especiada",
    "fraseOlfativa": "Especias oscuras y cuero en una composición de carácter fuerte.",
    "topNotes": [
      "Especias",
      "Ron",
      "Tabaco"
    ],
    "heartNotes": [
      "Cuero",
      "Iris",
      "Tuberosa"
    ],
    "baseNotes": [
      "Haba tonka",
      "Benjuí",
      "Madera de gaiac"
    ]
  },
  {
    "sku": "56",
    "contratipo": "BLACK OCEAN",
    "nombre": "Acqua Di Giò Profumo",
    "genero": "H",
    "marca": "Giorgio Armani",
    "anio": "2015",
    "familia": "Aromática Acuática",
    "fraseOlfativa": "La frescura del mar mezclada con un fondo de incienso.",
    "topNotes": [
      "Notas marinas",
      "Bergamota",
      "Elemí"
    ],
    "heartNotes": [
      "Romero",
      "Salvia",
      "Geranio"
    ],
    "baseNotes": [
      "Incienso",
      "Pachulí",
      "Ámbar"
    ]
  },
  {
    "sku": "57",
    "contratipo": "SWEET BOMB",
    "nombre": "La Bomba",
    "genero": "F",
    "marca": "Carolina Herrera",
    "anio": "2023",
    "familia": "Floral Frutal",
    "fraseOlfativa": "Floral y frutal, con una presencia dulce que se nota.",
    "topNotes": [
      "Cereza ácida",
      "Almendra amarga",
      "Frambuesa"
    ],
    "heartNotes": [
      "Rosa",
      "Azucena",
      "Jazmín"
    ],
    "baseNotes": [
      "Vainilla Bourbon",
      "Vetiver",
      "Haba tonka"
    ]
  },
  {
    "sku": "58",
    "contratipo": "FEMME FATALE",
    "nombre": "Good Girl",
    "genero": "F",
    "marca": "Carolina Herrera",
    "anio": "2016",
    "familia": "Ámbar Floral",
    "fraseOlfativa": "La dualidad entre flores blancas delicadas y cacao oscuro.",
    "topNotes": [
      "Almendra",
      "Café",
      "Bergamota",
      "Limón"
    ],
    "heartNotes": [
      "Tuberosa",
      "Jazmín Sambac",
      "Flor de azahar",
      "Rosa"
    ],
    "baseNotes": [
      "Haba tonka",
      "Cacao",
      "Vainilla",
      "Sándalo"
    ]
  },
  {
    "sku": "59",
    "contratipo": "BLACK BEAR",
    "nombre": "Toy Boy",
    "genero": "H",
    "marca": "Moschino",
    "anio": "2019",
    "familia": "Amaderada Especiada",
    "fraseOlfativa": "Una rosa especiada y diferente dentro de la perfumería masculina.",
    "topNotes": [
      "Pimienta rosa",
      "Pera",
      "Nuez moscada",
      "Elemí"
    ],
    "heartNotes": [
      "Rosa",
      "Clavo de olor",
      "Magnolia",
      "Flor de lino"
    ],
    "baseNotes": [
      "Cashmeran",
      "Vetiver de Haití",
      "Sándalo",
      "Ámbar"
    ]
  },
  {
    "sku": "60",
    "contratipo": "CRISTAL ROUGE",
    "nombre": "Baccarat Rouge 540",
    "genero": "U",
    "marca": "Maison Francis Kurkdjian",
    "anio": "2015",
    "familia": "Ámbar Floral",
    "fraseOlfativa": "Cálido, cristalino y con un rastro inconfundible en el aire.",
    "topNotes": [
      "Azafrán",
      "Jazmín",
      "Naranja sanguina"
    ],
    "heartNotes": [
      "Amberwood",
      "Ámbar gris",
      "Hediona"
    ],
    "baseNotes": [
      "Resina de abeto",
      "Cedro",
      "Almizcle"
    ]
  },
  {
    "sku": "61",
    "contratipo": "KELVIN",
    "nombre": "Fahrenheit",
    "genero": "H",
    "marca": "Dior",
    "anio": "1988",
    "familia": "Cuero Aromático Amaderado",
    "fraseOlfativa": "Un clásico de personalidad única entre cuero y maderas.",
    "topNotes": [
      "Lavanda",
      "Mandarina",
      "Flor de espino",
      "Nuez moscada"
    ],
    "heartNotes": [
      "Nuez moscada",
      "Madreselva",
      "Clavel",
      "Sándalo"
    ],
    "baseNotes": [
      "Cuero",
      "Haba tonka",
      "Ámbar",
      "Pachulí"
    ]
  },
  {
    "sku": "62",
    "contratipo": "BELLA AMOUR",
    "nombre": "Amarige",
    "genero": "F",
    "marca": "Givenchy",
    "anio": "1991",
    "familia": "Floral",
    "fraseOlfativa": "Un floral clásico, intenso y de estilo tradicional.",
    "topNotes": [
      "Flor de azahar",
      "Durazno",
      "Ciruela",
      "Neroli"
    ],
    "heartNotes": [
      "Tuberosa",
      "Mimosa",
      "Gardenia",
      "Ylang-ylang"
    ],
    "baseNotes": [
      "Sándalo",
      "Vainilla",
      "Ámbar",
      "Haba tonka"
    ]
  },
  {
    "sku": "63",
    "contratipo": "CELESTE STAR",
    "nombre": "Angel",
    "genero": "F",
    "marca": "Thierry Mugler",
    "anio": "1992",
    "familia": "Ámbar Vainilla",
    "fraseOlfativa": "El perfume que inauguró la familia de los aromas dulces.",
    "topNotes": [
      "Algodón de azúcar",
      "Coco",
      "Grosellas negras",
      "Melón"
    ],
    "heartNotes": [
      "Miel",
      "Frutos rojos",
      "Zarzamora",
      "Ciruela"
    ],
    "baseNotes": [
      "Pachulí",
      "Chocolate",
      "Caramelo",
      "Vainilla"
    ]
  },
  {
    "sku": "64",
    "contratipo": "GOLDEN MUSE",
    "nombre": "Eilish",
    "genero": "F",
    "marca": "Billie Eilish",
    "anio": "2021",
    "familia": "Ámbar Vainilla",
    "fraseOlfativa": "Vainilla cálida y especias suaves que se sienten reconfortantes.",
    "topNotes": [
      "Azúcar",
      "Frutos rojos",
      "Mandarina"
    ],
    "heartNotes": [
      "Vainilla",
      "Cacao",
      "Notas especiadas",
      "Rosa"
    ],
    "baseNotes": [
      "Haba tonka",
      "Ámbar",
      "Almizcle",
      "Notas amaderadas"
    ]
  },
  {
    "sku": "65",
    "contratipo": "MIDNIGHT TRICK",
    "nombre": "Halloween Man",
    "genero": "H",
    "marca": "Jesús del Pozo",
    "anio": "2012",
    "familia": "Ámbar Amaderada",
    "fraseOlfativa": "Dulce y especiado, con un carácter joven para la noche.",
    "topNotes": [
      "Martini de manzana",
      "Hojas de violeta",
      "Albahaca",
      "Mandarina"
    ],
    "heartNotes": [
      "Canela",
      "Lavanda",
      "Jengibre",
      "Flor de azahar"
    ],
    "baseNotes": [
      "Vainilla",
      "Ámbar",
      "Cuero",
      "Almizcle"
    ]
  },
  {
    "sku": "66",
    "contratipo": "NICHO LAVANDA",
    "nombre": "Lavande 31",
    "genero": "U",
    "marca": "Le Labo",
    "anio": "2023",
    "familia": "Aromática Fougère",
    "fraseOlfativa": "Lavanda limpia trabajada con la pureza de la alta perfumería.",
    "topNotes": [
      "Bergamota",
      "Neroli",
      "Petit grain"
    ],
    "heartNotes": [
      "Lavanda",
      "Salvia",
      "Geranio"
    ],
    "baseNotes": [
      "Almizcle",
      "Haba tonka",
      "Ámbar"
    ]
  },
  {
    "sku": "67",
    "contratipo": "MILANO CHIC",
    "nombre": "Paradoxe",
    "genero": "F",
    "marca": "Prada",
    "anio": "2022",
    "familia": "Ámbar Floral",
    "fraseOlfativa": "Equilibrio moderno entre la frescura floral y el ámbar cálido.",
    "topNotes": [
      "Pera",
      "Mandarina",
      "Bergamota"
    ],
    "heartNotes": [
      "Flor de azahar",
      "Neroli",
      "Jazmín Sambac"
    ],
    "baseNotes": [
      "Vainilla Bourbon",
      "Ámbar",
      "Almizcle blanco",
      "Benjuí"
    ]
  },
  {
    "sku": "68",
    "contratipo": "AMERICAN GIRL",
    "nombre": "Tommy Girl",
    "genero": "F",
    "marca": "Tommy Hilfiger",
    "anio": "1996",
    "familia": "Floral Frutal",
    "fraseOlfativa": "Ligero y fresco, como una tarde tranquila al aire libre.",
    "topNotes": [
      "Manzano en flor",
      "Camelia",
      "Mandarina",
      "Grosellas negras"
    ],
    "heartNotes": [
      "Limón",
      "Madreselva",
      "Pomelo",
      "Rosa"
    ],
    "baseNotes": [
      "Magnolia",
      "Jazmín",
      "Cedro",
      "Sándalo"
    ]
  },
  {
    "sku": "69",
    "contratipo": "SCARLET LUXE",
    "nombre": "Eau de Rhubarbe Écarlate",
    "genero": "U",
    "marca": "Hermès",
    "anio": "2016",
    "familia": "Aromática Frutal",
    "fraseOlfativa": "Un aroma frutal distinto, ácido y sumamente refrescante.",
    "topNotes": [
      "Ruibarbo",
      "Toronja",
      "Mandarina"
    ],
    "heartNotes": [
      "Frutos rojos",
      "Rosa",
      "Lichi"
    ],
    "baseNotes": [
      "Almizcle blanco",
      "Notas amaderadas",
      "Vetiver"
    ]
  },
  {
    "sku": "70",
    "contratipo": "BLOSSOM DREAM",
    "nombre": "Endless Euphoria",
    "genero": "F",
    "marca": "Calvin Klein",
    "anio": "2014",
    "familia": "Floral Frutal",
    "fraseOlfativa": "Suave y primaveral, inspirado en los cerezos en flor.",
    "topNotes": [
      "Flor del cerezo",
      "Mandarina",
      "Bergamota"
    ],
    "heartNotes": [
      "Rosa",
      "Violeta",
      "Lila"
    ],
    "baseNotes": [
      "Bambú",
      "Almizcle",
      "Sándalo"
    ]
  },
  {
    "sku": "71",
    "contratipo": "CHOCO ROYALTY",
    "nombre": "Bharara Chocolate",
    "genero": "U",
    "marca": "Bharara",
    "anio": "2021",
    "familia": "Ámbar Vainilla Gourmand",
    "fraseOlfativa": "Intenso aroma a cacao dulce con maderas y vainilla.",
    "topNotes": [
      "Chocolate",
      "Cacao",
      "Bergamota",
      "Canela"
    ],
    "heartNotes": [
      "Caramelo",
      "Avellana",
      "Leche",
      "Jazmín"
    ],
    "baseNotes": [
      "Vainilla",
      "Haba tonka",
      "Ámbar",
      "Sándalo",
      "Almizcle"
    ]
  },
  {
    "sku": "72",
    "contratipo": "BLUE WAVE",
    "nombre": "Cool Water",
    "genero": "H",
    "marca": "Davidoff",
    "anio": "1988",
    "familia": "Aromática Acuática",
    "fraseOlfativa": "El pionero de la frescura marina limpia en la perfumería.",
    "topNotes": [
      "Agua de mar",
      "Lavanda",
      "Menta",
      "Notas verdes"
    ],
    "heartNotes": [
      "Sándalo",
      "Neroli",
      "Geranio",
      "Jazmín"
    ],
    "baseNotes": [
      "Almizcle",
      "Musgo de roble",
      "Cedro",
      "Tabaco"
    ]
  },
  {
    "sku": "73",
    "contratipo": "VIKINGO NOIR",
    "nombre": "Drakkar Noir",
    "genero": "H",
    "marca": "Guy Laroche",
    "anio": "1982",
    "familia": "Aromática Fougère",
    "fraseOlfativa": "El aroma clásico de barbería que definió toda una década.",
    "topNotes": [
      "Lavanda",
      "Limón",
      "Bergamota",
      "Romero"
    ],
    "heartNotes": [
      "Enebro",
      "Cilantro",
      "Canela",
      "Clavel"
    ],
    "baseNotes": [
      "Musgo de roble",
      "Cuero",
      "Agujas de pino",
      "Sándalo"
    ]
  },
  {
    "sku": "74",
    "contratipo": "INMORTAL",
    "nombre": "Eternity",
    "genero": "H",
    "marca": "Calvin Klein",
    "anio": "1990",
    "familia": "Aromática Fougère",
    "fraseOlfativa": "Un herbal limpio y atemporal que nunca pasa de moda.",
    "topNotes": [
      "Lavanda",
      "Limón",
      "Bergamota",
      "Mandarina"
    ],
    "heartNotes": [
      "Salvia",
      "Enebro",
      "Albahaca",
      "Geranio"
    ],
    "baseNotes": [
      "Sándalo",
      "Vetiver",
      "Almizcle",
      "Palo de rosa"
    ]
  },
  {
    "sku": "75",
    "contratipo": "NIPPON MAJEURE",
    "nombre": "L'Eau Super Majeure d'Issey",
    "genero": "H",
    "marca": "Issey Miyake",
    "anio": "2018",
    "familia": "Amaderada Acuática",
    "fraseOlfativa": "Maderas oscuras con el toque salado del agua de mar.",
    "topNotes": [
      "Salvia",
      "Romero",
      "Cítricos"
    ],
    "heartNotes": [
      "Sal de mar",
      "Notas marinas",
      "Cashmeran",
      "Pachulí"
    ],
    "baseNotes": [
      "Humo",
      "Amberwood",
      "Cuero",
      "Haba tonka"
    ]
  },
  {
    "sku": "76",
    "contratipo": "TITAN BLANC",
    "nombre": "Legend",
    "genero": "H",
    "marca": "Montblanc",
    "anio": "2011",
    "familia": "Aromática Fougère",
    "fraseOlfativa": "Elegante y versátil, de corte clásico para cualquier ocasión.",
    "topNotes": [
      "Lavanda",
      "Piña",
      "Bergamota",
      "Verbena"
    ],
    "heartNotes": [
      "Manzana roja",
      "Frutos rojos",
      "Musgo de roble",
      "Geranio"
    ],
    "baseNotes": [
      "Haba tonka",
      "Sándalo",
      "Evernyl"
    ]
  },
  {
    "sku": "77",
    "contratipo": "SULTÁN IMPERIAL",
    "nombre": "Oud For Glory",
    "genero": "U",
    "marca": "Lattafa",
    "anio": "2020",
    "familia": "Ámbar Amaderada",
    "fraseOlfativa": "La intensidad de las maderas orientales y las especias cálidas.",
    "topNotes": [
      "Azafrán",
      "Nuez moscada",
      "Lavanda"
    ],
    "heartNotes": [
      "Madera de oud",
      "Pachulí",
      "Cipriol"
    ],
    "baseNotes": [
      "Madera de oud",
      "Almizcle",
      "Ámbar"
    ]
  },
  {
    "sku": "78",
    "contratipo": "CYBERBOT",
    "nombre": "Phantom Parfum",
    "genero": "H",
    "marca": "Paco Rabanne",
    "anio": "2023",
    "familia": "Aromática Especiada",
    "fraseOlfativa": "Una mezcla moderna de lavanda aromática y vainilla oscura.",
    "topNotes": [
      "Cardamomo",
      "Bergamota",
      "Ruibarbo",
      "Limón"
    ],
    "heartNotes": [
      "Lavanda",
      "Pachulí",
      "Cedro",
      "Geranio"
    ],
    "baseNotes": [
      "Vainilla",
      "Bálsamo de Tolú",
      "Vetiver de Haití"
    ]
  },
  {
    "sku": "79",
    "contratipo": "VARSITY BLUE",
    "nombre": "Polo Sport",
    "genero": "H",
    "marca": "Ralph Lauren",
    "anio": "1994",
    "familia": "Aromática Verde",
    "fraseOlfativa": "Frescura verde y limpia pensada para el movimiento diario.",
    "topNotes": [
      "Menta",
      "Aldehídos",
      "Lavanda",
      "Bergamota"
    ],
    "heartNotes": [
      "Notas marinas",
      "Jengibre",
      "Jazmín",
      "Geranio"
    ],
    "baseNotes": [
      "Almizcle",
      "Sándalo",
      "Cedro",
      "Madera de gaiac"
    ]
  },
  {
    "sku": "80",
    "contratipo": "CUMBRE DE PLATA",
    "nombre": "Silver Mountain Water",
    "genero": "H",
    "marca": "Creed",
    "anio": "1995",
    "familia": "Aromática",
    "fraseOlfativa": "Inspirado en el agua helada de los arroyos de montaña.",
    "topNotes": [
      "Bergamota",
      "Mandarina",
      "Neroli"
    ],
    "heartNotes": [
      "Té verde",
      "Grosellas negras",
      "Notas ozónicas"
    ],
    "baseNotes": [
      "Almizcle",
      "Petit grain",
      "Sándalo",
      "Gálbano"
    ]
  },
  {
    "sku": "81",
    "contratipo": "CUERO TOSCANO",
    "nombre": "Tuscan Leather",
    "genero": "U",
    "marca": "Tom Ford",
    "anio": "2007",
    "familia": "Cuero",
    "fraseOlfativa": "El olor intenso del cuero fino con un matiz frutal seco.",
    "topNotes": [
      "Frambuesa",
      "Azafrán",
      "Tomillo"
    ],
    "heartNotes": [
      "Olíbano",
      "Jazmín",
      "Artemisia"
    ],
    "baseNotes": [
      "Cuero",
      "Gamuza",
      "Notas amaderadas",
      "Ámbar"
    ]
  },
  {
    "sku": "82",
    "contratipo": "EUROBOY CORAL",
    "nombre": "Born In Roma Coral Fantasy",
    "genero": "H",
    "marca": "Valentino",
    "anio": "2022",
    "familia": "Amaderada Aromática",
    "fraseOlfativa": "Fruta fresca y tabaco suave en una combinación moderna.",
    "topNotes": [
      "Manzana roja",
      "Cardamomo",
      "Bergamota"
    ],
    "heartNotes": [
      "Lavanda",
      "Geranio",
      "Salvia"
    ],
    "baseNotes": [
      "Tabaco",
      "Pachulí",
      "Vetiver de Haití"
    ]
  },
  {
    "sku": "83",
    "contratipo": "PINK HEAVEN",
    "nombre": "Cloud Pink",
    "genero": "F",
    "marca": "Ariana Grande",
    "anio": "2023",
    "familia": "Ámbar Vainilla",
    "fraseOlfativa": "Dulzura soñadora de frutos exóticos, agua de coco y praliné.",
    "topNotes": [
      "Pitahaya",
      "Frutos rojos",
      "Piña"
    ],
    "heartNotes": [
      "Agua de coco",
      "Orquídea de vainilla",
      "Ambreta"
    ],
    "baseNotes": [
      "Praliné",
      "Almizcle",
      "Amberwood",
      "Musgo"
    ]
  },
  {
    "sku": "84",
    "contratipo": "NICHO OUD",
    "nombre": "Oud Wood",
    "genero": "U",
    "marca": "Tom Ford",
    "anio": "2007",
    "familia": "Ámbar Amaderada",
    "fraseOlfativa": "Maderas exóticas de oud y sándalo con especias de Oriente.",
    "topNotes": [
      "Cardamomo",
      "Palo de rosa",
      "Pimienta de Sichuan"
    ],
    "heartNotes": [
      "Madera de oud",
      "Sándalo",
      "Vetiver"
    ],
    "baseNotes": [
      "Haba tonka",
      "Vainilla",
      "Ámbar"
    ]
  },
  {
    "sku": "85",
    "contratipo": "BLACK LEATHER",
    "nombre": "Ombré Leather",
    "genero": "H",
    "marca": "Tom Ford",
    "anio": "2018",
    "familia": "Cuero",
    "fraseOlfativa": "Cuero negro profundo con cardamomo y calidez de ámbar.",
    "topNotes": [
      "Cardamomo",
      "Azafrán",
      "Pimienta negra"
    ],
    "heartNotes": [
      "Cuero negro",
      "Jazmín Sambac",
      "Hojas de violeta"
    ],
    "baseNotes": [
      "Ámbar",
      "Musgo de roble",
      "Pachulí"
    ]
  },
  {
    "sku": "86",
    "contratipo": "BLUE OCEAN",
    "nombre": "Nautica Voyage",
    "genero": "H",
    "marca": "Nautica",
    "anio": "2006",
    "familia": "Amaderada Acuática",
    "fraseOlfativa": "Brisa marina limpia con manzana verde y flor de loto.",
    "topNotes": [
      "Manzana verde",
      "Hojas verdes",
      "Bergamota"
    ],
    "heartNotes": [
      "Flor de loto",
      "Mimosa",
      "Notas marinas"
    ],
    "baseNotes": [
      "Almizcle",
      "Cedro",
      "Musgo de roble",
      "Ámbar"
    ]
  },
  {
    "sku": "87",
    "contratipo": "STARBOY",
    "nombre": "Y Eau de Parfum",
    "genero": "H",
    "marca": "Yves Saint Laurent",
    "anio": "2018",
    "familia": "Aromática Fougère",
    "fraseOlfativa": "Frescura de manzana y jengibre sobre maderas aromáticas.",
    "topNotes": [
      "Manzana verde",
      "Jengibre",
      "Bergamota"
    ],
    "heartNotes": [
      "Salvia",
      "Bayas de enebro",
      "Geranio"
    ],
    "baseNotes": [
      "Amberwood",
      "Haba tonka",
      "Cedro",
      "Vetiver",
      "Olíbano"
    ]
  },
  {
    "sku": "88",
    "contratipo": "PLAYBOY",
    "nombre": "The Most Wanted",
    "genero": "H",
    "marca": "Azzaro",
    "anio": "2021",
    "familia": "Ámbar Especiada",
    "fraseOlfativa": "Cardamomo vibrante fundido con caramelo tibio y maderas.",
    "topNotes": [
      "Cardamomo",
      "Jengibre",
      "Bergamota"
    ],
    "heartNotes": [
      "Caramelo",
      "Lavanda",
      "Canela"
    ],
    "baseNotes": [
      "Amberwood",
      "Vainilla Bourbon",
      "Vetiver"
    ]
  },
  {
    "sku": "89",
    "contratipo": "BEVERLY BOY",
    "nombre": "Paris Hilton",
    "genero": "H",
    "marca": "Paris Hilton",
    "anio": "2005",
    "familia": "Aromática Frutal",
    "fraseOlfativa": "Mango jugoso, hojas de higuera y brisa fresca sobre maderas.",
    "topNotes": [
      "Mango",
      "Hojas de higuera",
      "Aire de montaña"
    ],
    "heartNotes": [
      "Salvia blanca",
      "Bayas de enebro",
      "Albahaca"
    ],
    "baseNotes": [
      "Pepino",
      "Cedro",
      "Almizcle",
      "Ámbar"
    ]
  },
  {
    "sku": "90",
    "contratipo": "ROCKSTAR",
    "nombre": "Black XS",
    "genero": "H",
    "marca": "Paco Rabanne",
    "anio": "2005",
    "familia": "Ámbar Amaderada",
    "fraseOlfativa": "Limón vibrante, praliné dulce y canela sobre ámbar negro.",
    "topNotes": [
      "Limón",
      "Salvia",
      "Caléndula"
    ],
    "heartNotes": [
      "Praliné",
      "Canela",
      "Cardamomo negro",
      "Bálsamo de Tolú"
    ],
    "baseNotes": [
      "Ámbar negro",
      "Pachulí",
      "Palo de rosa",
      "Ébano"
    ]
  }
];

export function getStickerGenderName(genero: string): 'Caballero' | 'Dama' | 'Unisex' {
  if (genero === 'H') return 'Caballero';
  if (genero === 'F') return 'Dama';
  return 'Unisex';
}

export function getStickerFooterClassification(genero: string): string {
  if (genero === 'H') return 'PARA HOMBRE / ESENCIA DE AUTOR';
  if (genero === 'F') return 'PARA MUJER / ESENCIA DE AUTOR';
  return 'UNISEX / ESENCIA DE AUTOR';
}

export function getCricutStickerEntryForProduct(
  product: { id?: string | null; sku?: string | null; category?: string | null } | null | undefined
): CricutStickerCatalogEntry | null {
  if (!product) return null;
  const idStr = String(product.id || '').trim().toLowerCase();
  const skuStr = String(product.sku || '').trim().toUpperCase();

  let numSku = '';
  const idMatch = idStr.match(/^sticker-0*(\d+)$/);
  if (idMatch) {
    numSku = idMatch[1];
  } else if (skuStr.startsWith('STK-')) {
    numSku = skuStr.replace(/^STK-0*/, '');
  }

  if (!numSku) return null;
  return CRICUT_STICKERS_CATALOG.find((item) => String(item.sku) === numSku) || null;
}

export const CRICUT_STICKER_SPECS = {
  labelWidthCm: 5.3,
  labelHeightCm: 5.0,
  labelWidthMm: 53.0,
  labelHeightMm: 50.0,
  cutWidthCm: 5.6,
  cutHeightCm: 5.3,
  cutWidthMm: 56.0,
  cutHeightMm: 53.0,
  borderMarginMm: 1.5,
  dpi: 304.8,
  shortBadge: '5.3 × 5.0 cm (53 × 50 mm)',
  fullMeasureText: 'Etiqueta 5.3 × 5.0 cm (53 × 50 mm)',
};

export interface StickerBottleMockupConfig {
  id: string;
  productId: string;
  name: string;
  shortName: string;
  subtitle: string;
  bottleImageUrl: string;
  cx: number;
  cy: number;
  targetWidth: number;
  targetHeight: number;
  sagitta: number;
}

export const STICKER_BOTTLE_MOCKUPS: StickerBottleMockupConfig[] = [
  {
    id: 'rey-luis',
    productId: 'bote-100ml-rey-luis',
    name: 'Bote Rey Luis 100ml Rosca',
    shortName: 'Bote Rey Luis 100ml',
    subtitle: 'Cilíndrico vidrio cristalino • Tapa escalonada negra',
    bottleImageUrl: '/images/botes/bote_100ml_rey_luis.jpg',
    cx: 401,
    cy: 495,
    targetWidth: 224,
    targetHeight: 211,
    sagitta: 2.8,
  },
  {
    id: 'goliat',
    productId: 'bote-100ml-goliat',
    name: 'Bote Goliat 100ml Rosca',
    shortName: 'Bote Goliat 100ml',
    subtitle: 'Vidrio pesado base gruesa • Tapa negra brillante',
    bottleImageUrl: '/images/botes/bote_100ml_goliat.jpg',
    cx: 400,
    cy: 492,
    targetWidth: 242,
    targetHeight: 228,
    sagitta: 1.4,
  },
  {
    id: 'wolf',
    productId: 'bote-100ml-wolf',
    name: 'Bote Wolf 100ml Rosca',
    shortName: 'Bote Wolf 100ml',
    subtitle: 'Cilíndrico tipo campana • Tapa metálica plateada',
    bottleImageUrl: '/images/botes/bote_100ml_wolf.jpg',
    cx: 400,
    cy: 500,
    targetWidth: 236,
    targetHeight: 223,
    sagitta: 2.6,
  },
  {
    id: 'golf-club',
    productId: 'bote-100ml-golf-club',
    name: 'Bote Golf Club 100ml Rosca',
    shortName: 'Bote Golf Club 100ml',
    subtitle: 'Rectangular contorneado • Tapa metálica plateada',
    bottleImageUrl: '/images/botes/bote_100ml_golf_club.jpg',
    cx: 400,
    cy: 502,
    targetWidth: 248,
    targetHeight: 234,
    sagitta: 1.2,
  },
  {
    id: 'cosmo',
    productId: 'bote-100ml-cosmo',
    name: 'Bote Cosmo 100ml Rosca',
    shortName: 'Bote Cosmo 100ml',
    subtitle: 'Cuadrado vidrio pesado • Tapa cilíndrica plateada',
    bottleImageUrl: '/images/botes/bote_100ml_cosmo.jpg',
    cx: 400,
    cy: 495,
    targetWidth: 248,
    targetHeight: 234,
    sagitta: 0.8,
  },
  {
    id: 'nicho-oro',
    productId: 'bote-100ml-santal-oro',
    name: 'Bote Nicho 100ml Rosca',
    shortName: 'Bote Nicho 100ml',
    subtitle: 'Cilíndrico transparente • Tapa oro moleteado',
    bottleImageUrl: '/images/botes/bote_100ml_cilindrico_tapa_oro.jpg',
    cx: 400,
    cy: 512,
    targetWidth: 228,
    targetHeight: 215,
    sagitta: 2.6,
  },
  {
    id: 'man-beige',
    productId: 'bote-100ml-frosted-cilindro-madera-clara',
    name: 'Bote Man Beige 100ml Rosca',
    shortName: 'Bote Man Beige 100ml',
    subtitle: 'Vidrio esmerilado satinado • Tapa madera clara',
    bottleImageUrl: '/images/botes/bote_100ml_frosted_cilindro_madera_clara.jpg',
    cx: 400,
    cy: 526,
    targetWidth: 218,
    targetHeight: 206,
    sagitta: 2.6,
  },
];

export const INITIAL_STICKER_PRODUCTS: ProductItem[] = CRICUT_STICKERS_CATALOG.map((item) => {
  const paddedSku = String(item.sku).padStart(3, '0');
  const genderName = getStickerGenderName(item.genero);
  const topStr = item.topNotes.join(', ');
  const heartStr = item.heartNotes.join(', ');
  const baseStr = item.baseNotes.join(', ');

  return {
    id: `sticker-${item.sku}`,
    sku: `STK-${item.sku}`,
    barcode: `741008000${paddedSku}`,
    name: `Sticker Inspirado en ${item.nombre}`,
    officialName: `Sticker ${item.nombre}`,
    brand: item.marca,
    gender: genderName,
    category: 'Stickers',
    unit: 'Unidad',
    price: 0.35,
    cost: 0.05,
    stock: 0,
    stockHalf: 0,
    minStock: 5,
    imageUrl: `/images/stickers/sticker_${item.sku}.webp`,
    description: `Sticker genérico medida 5.3 × 5.0 cm (53 × 50 mm) con las notas de tu perfume (Salida: ${topStr} · Corazón: ${heartStr} · Fondo: ${baseStr}), la casa inspirada (${item.marca} · ${item.anio}) y el nombre inspirado en ${item.nombre} (${item.contratipo}). "${item.fraseOlfativa}"`,
    isAvailableOnline: true,
    puesto: 'C3',
    supplier: 'Aromaniak',
  };
});
