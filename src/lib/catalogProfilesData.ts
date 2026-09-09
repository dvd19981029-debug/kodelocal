export interface StaticProfile {
  family: string;
  accords: string[];
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  season: string;
  occasion: string;
  intensity: 'Sutil' | 'Moderada' | 'Intensa';
}

export const CATALOG_PROFILES_48: Record<string, StaticProfile> = {
  '1': {
    family: 'Aromática Fougère',
    accords: ['fresco especiado', 'ámbar', 'cítrico', 'aromático', 'almizclado'],
    topNotes: ['Bergamota de Calabria', 'Pimienta'],
    heartNotes: ['Pimienta de Sichuan', 'Lavanda', 'Pimienta rosa', 'Vetiver', 'Pachulí', 'Geranio'],
    baseNotes: ['Ambroxan', 'Cedro', 'Ládano'],
    season: 'Todo el año / Versátil',
    occasion: 'Uso diario, oficina y eventos especiales',
    intensity: 'Intensa'
  },
  '2': {
    family: 'Amaderada Aromática',
    accords: ['cítrico', 'amaderado', 'cálido especiado', 'aromático', 'ámbar'],
    topNotes: ['Pomelo', 'Limón', 'Menta', 'Pimienta rosa'],
    heartNotes: ['Jengibre', 'Nuez moscada', 'Jazmín', 'Iso E Super'],
    baseNotes: ['Incienso', 'Vetiver', 'Cedro', 'Sándalo', 'Pachulí'],
    season: 'Todo el año / Firma personal',
    occasion: 'Negocios, citas elegantes y noche',
    intensity: 'Moderada'
  },
  '3': {
    family: 'Aromática Acuática',
    accords: ['marino', 'cítrico', 'aromático', 'fresco'],
    topNotes: ['Lima', 'Limón', 'Bergamota', 'Jazmín', 'Naranja', 'Mandarina'],
    heartNotes: ['Notas marinas', 'Durazno', 'Fresia', 'Romero', 'Ciclamen'],
    baseNotes: ['Almizcle blanco', 'Cedro', 'Musgo de roble', 'Pachulí', 'Ámbar'],
    season: 'Primavera / Verano / Días soleados',
    occasion: 'Uso diario, paseos, oficina y aire libre',
    intensity: 'Moderada'
  },
  '4': {
    family: 'Amaderada Especiada',
    accords: ['cítrico', 'afrutado', 'amaderado', 'ahumado', 'cuero'],
    topNotes: ['Limón', 'Piña', 'Bergamota', 'Grosellas negras', 'Manzana'],
    heartNotes: ['Abedul', 'Jazmín', 'Rosa'],
    baseNotes: ['Almizcle', 'Ámbar gris', 'Pachulí', 'Vainilla'],
    season: 'Todo el año',
    occasion: 'Salidas, impacto nocturno y ocasiones especiales',
    intensity: 'Intensa'
  },
  '5': {
    family: 'Chipre Frutal',
    accords: ['afrutado', 'ahumado', 'amaderado', 'dulce', 'cuero'],
    topNotes: ['Piña', 'Bergamota', 'Grosellas negras', 'Manzana'],
    heartNotes: ['Abedul', 'Pachulí', 'Jazmín de Marruecos', 'Rosa'],
    baseNotes: ['Almizcle', 'Musgo de roble', 'Ámbar gris', 'Vainilla'],
    season: 'Todo el año / Alta presencia',
    occasion: 'Reuniones ejecutivas, eventos de gala y distinción',
    intensity: 'Intensa'
  },
  '6': {
    family: 'Floral Frutal Gourmand',
    accords: ['dulce', 'avainillado', 'afrutado', 'floral', 'atalcado'],
    topNotes: ['Grosellas negras', 'Pera'],
    heartNotes: ['Iris', 'Jazmín', 'Flor de azahar del naranjo'],
    baseNotes: ['Praliné', 'Vainilla', 'Pachulí', 'Haba tonka'],
    season: 'Otoño / Invierno / Clima fresco',
    occasion: 'Citas románticas, fiestas y celebraciones',
    intensity: 'Intensa'
  },
  '7': {
    family: 'Cítrica Ambarada',
    accords: ['cítrico', 'dulce', 'caramelo', 'ámbar', 'amaderado'],
    topNotes: ['Mandarina', 'Naranja', 'Azafrán'],
    heartNotes: ['Caramelo', 'Haba tonka', 'Tagetes'],
    baseNotes: ['Ambroxan', 'Cedro', 'Vetiver'],
    season: 'Todo el año',
    occasion: 'Salidas casuales, tarde y noche',
    intensity: 'Intensa'
  },
  '8': {
    family: 'Aromática Fougère',
    accords: ['avainillado', 'aromático', 'verde', 'fresco especiado', 'ámbar'],
    topNotes: ['Menta', 'Manzana verde', 'Limón'],
    heartNotes: ['Haba tonka', 'Ambroxan', 'Geranio'],
    baseNotes: ['Vainilla de Madagascar', 'Cedro de Virginia', 'Vetiver', 'Musgo de roble'],
    season: 'Noche / Fiestas / Clima templado',
    occasion: 'Fiestas, eventos sociales y conquista',
    intensity: 'Intensa'
  },
  '9': {
    family: 'Amaderada Acuática',
    accords: ['cítrico', 'aromático', 'fresco especiado', 'acuático', 'floral'],
    topNotes: ['Yuzu', 'Limón', 'Bergamota', 'Mandarina', 'Ciprés'],
    heartNotes: ['Lirio de los valles', 'Nuez moscada', 'Loto azul', 'Canela'],
    baseNotes: ['Vetiver de Tahití', 'Almizcle', 'Cedro', 'Sándalo', 'Ámbar'],
    season: 'Primavera / Verano / Calor',
    occasion: 'Uso diario refrescante y oficina',
    intensity: 'Moderada'
  },
  '10': {
    family: 'Amaderada Aromática',
    accords: ['amaderado', 'atalcado', 'cuero', 'cálido especiado', 'violeta'],
    topNotes: ['Cardamomo', 'Violeta', 'Papiro de Egipto'],
    heartNotes: ['Iris', 'Ámbar', 'Cedro'],
    baseNotes: ['Sándalo', 'Cuero', 'Almizcle'],
    season: 'Todo el año / Firma vanguardista',
    occasion: 'Galerías, reuniones creativas y estilo urbano',
    intensity: 'Intensa'
  },
  '11': {
    family: 'Ámbar Fougère',
    accords: ['avainillado', 'ámbar', 'aromático', 'cálido especiado'],
    topNotes: ['Vainilla de Bourbon', 'Ámbar'],
    heartNotes: ['Lavanda'],
    baseNotes: ['Vetiver ahumado'],
    season: 'Otoño / Invierno / Noche',
    occasion: 'Salidas nocturnas y citas',
    intensity: 'Intensa'
  },
  '12': {
    family: 'Ámbar Frutal',
    accords: ['afrutado', 'cítrico', 'dulce', 'almizclado', 'atalcado'],
    topNotes: ['Naranja de Sicilia', 'Bergamota de Calabria', 'Limón de Sicilia'],
    heartNotes: ['Frutas mediterráneas'],
    baseNotes: ['Almizcle blanco', 'Vainilla de Madagascar', 'Ámbar'],
    season: 'Todo el año',
    occasion: 'Eventos de lujo, viajes y salidas exclusivas',
    intensity: 'Intensa'
  },
  '13': {
    family: 'Ámbar Floral',
    accords: ['cítrico', 'pachulí', 'floral blanco', 'dulce', 'rosas'],
    topNotes: ['Naranja', 'Mandarina', 'Bergamota', 'Flor de azahar'],
    heartNotes: ['Rosa turca', 'Jazmín', 'Mimosa', 'Ylang-ylang'],
    baseNotes: ['Pachulí', 'Almizcle blanco', 'Vainilla', 'Vetiver', 'Haba tonka'],
    season: 'Todo el año / Versátil elegante',
    occasion: 'Oficina ejecutiva, citas y eventos formales',
    intensity: 'Intensa'
  },
  '14': {
    family: 'Floral Frutal',
    accords: ['cítrico', 'amaderado', 'fresco', 'afrutado', 'aromático'],
    topNotes: ['Limón siciliano', 'Manzana', 'Cedro', 'Campanilla'],
    heartNotes: ['Bambú', 'Jazmín', 'Rosa blanca'],
    baseNotes: ['Cedro', 'Almizcle', 'Ámbar'],
    season: 'Primavera / Verano / Calor',
    occasion: 'Día a día, fines de semana y vacaciones',
    intensity: 'Moderada'
  },
  '15': {
    family: 'Amaderada Especiada',
    accords: ['amaderado', 'afrutado', 'cálido especiado', 'avainillado', 'canela'],
    topNotes: ['Manzana', 'Ciruela', 'Bergamota', 'Limón', 'Musgo de roble'],
    heartNotes: ['Canela', 'Caoba', 'Clavel'],
    baseNotes: ['Vainilla', 'Sándalo', 'Cedro', 'Vetiver', 'Olivo'],
    season: 'Todo el año',
    occasion: 'Trabajo diario, negocios y reuniones formales',
    intensity: 'Moderada'
  },
  '16': {
    family: 'Amaderada Acuática',
    accords: ['marino', 'cítrico', 'aromático', 'ámbar', 'amaderado'],
    topNotes: ['Notas marinas', 'Pomelo', 'Mandarina'],
    heartNotes: ['Hoja de laurel', 'Jazmín'],
    baseNotes: ['Ámbar gris', 'Madera de gaiac', 'Musgo de roble', 'Pachulí'],
    season: 'Primavera / Verano / Todo el año',
    occasion: 'Gimnasio, salidas con amigos y citas casuales',
    intensity: 'Intensa'
  },
  '17': {
    family: 'Floral Frutal Gourmand',
    accords: ['afrutado', 'dulce', 'amaderado', 'atalcado', 'almizclado'],
    topNotes: ['Fresa', 'Frambuesa', 'Mora', 'Grosellas negras', 'Cereza'],
    heartNotes: ['Violeta', 'Jazmín'],
    baseNotes: ['Almizcle', 'Vainilla', 'Ámbar', 'Pachulí', 'Musgo de roble'],
    season: 'Primavera / Otoño / Todo el año',
    occasion: 'Uso diario moderno y salidas casuales',
    intensity: 'Moderada'
  },
  '18': {
    family: 'Floral Frutal',
    accords: ['champán', 'afrutado', 'floral', 'amaderado', 'dulce'],
    topNotes: ['Champán rosado', 'Notas afrutadas'],
    heartNotes: ['Flor del duraznero'],
    baseNotes: ['Notas amaderadas', 'Almizcle blanco', 'Ámbar'],
    season: 'Todo el año / Noches festivas',
    occasion: 'Fiestas, cócteles y salidas nocturnas',
    intensity: 'Moderada'
  },
  '19': {
    family: 'Aromática Fougère',
    accords: ['aromático', 'marino', 'ozónico', 'fresco especiado', 'verde'],
    topNotes: ['Pepino', 'Melón', 'Mandarina'],
    heartNotes: ['Albahaca', 'Salvia', 'Geranio'],
    baseNotes: ['Gamuza', 'Notas amaderadas', 'Almizcle'],
    season: 'Primavera / Verano',
    occasion: 'Uso diario impecable y reuniones al aire libre',
    intensity: 'Moderada'
  },
  '20': {
    family: 'Amaderada Especiada',
    accords: ['cálido especiado', 'canela', 'cuero', 'ámbar', 'cítrico'],
    topNotes: ['Mandarina roja', 'Pomelo', 'Menta'],
    heartNotes: ['Canela', 'Notas especiadas', 'Rosa'],
    baseNotes: ['Ámbar', 'Cuero', 'Notas amaderadas', 'Pachulí hindú'],
    season: 'Otoño / Invierno / Noche',
    occasion: 'Eventos nocturnos, fiestas y vida social activa',
    intensity: 'Intensa'
  },
  '21': {
    family: 'Ámbar Especiada',
    accords: ['cálido especiado', 'ámbar', 'dulce', 'atalcado', 'amaderado'],
    topNotes: ['Coriandro', 'Mandarina', 'Durazno', 'Jazmín', 'Rosa de Bulgaria'],
    heartNotes: ['Mimosa', 'Clavo de olor', 'Flor de azahar', 'Trébol blanco', 'Rosa'],
    baseNotes: ['Ládano', 'Ámbar', 'Sándalo', 'Haba tonka', 'Opopónaco', 'Vainilla'],
    season: 'Otoño / Invierno / Noche',
    occasion: 'Cenas de gala y ocasiones de máxima etiqueta',
    intensity: 'Intensa'
  },
  '22': {
    family: 'Chipre Floral',
    accords: ['pachulí', 'cítrico', 'floral blanco', 'dulce', 'especiado suave'],
    topNotes: ['Pachulí', 'Pimienta rosa', 'Piña', 'Jacinto', 'Iris'],
    heartNotes: ['Limón', 'Jazmín', 'Rosa'],
    baseNotes: ['Pachulí', 'Almizcle', 'Vetiver', 'Vainilla'],
    season: 'Todo el año',
    occasion: 'Trabajo, paseos y ocasiones especiales',
    intensity: 'Moderada'
  },
  '23': {
    family: 'Ámbar Vainilla',
    accords: ['avainillado', 'dulce', 'afrutado', 'cálido especiado', 'ámbar'],
    topNotes: ['Manzana', 'Canela', 'Lavanda silvestre', 'Bergamota'],
    heartNotes: ['Flor de azahar del naranjo', 'Lirio de los valles'],
    baseNotes: ['Vainilla', 'Haba tonka', 'Ámbar', 'Pachulí'],
    season: 'Noche / Clima templado y frío',
    occasion: 'Fiestas nocturnas y citas',
    intensity: 'Intensa'
  },
  '24': {
    family: 'Ámbar Fougère',
    accords: ['avainillado', 'aromático', 'fresco especiado', 'lavanda', 'cálido especiado'],
    topNotes: ['Lavanda', 'Menta', 'Cardamomo', 'Bergamota', 'Artemisia'],
    heartNotes: ['Canela', 'Flor de azahar del naranjo', 'Alcaravea'],
    baseNotes: ['Vainilla', 'Haba tonka', 'Ámbar', 'Sándalo', 'Cedro'],
    season: 'Todo el año / Noche y clima fresco',
    occasion: 'Eventos nocturnos, citas y salidas',
    intensity: 'Intensa'
  },
  '25': {
    family: 'Floral Frutal',
    accords: ['floral blanco', 'floral', 'afrutado', 'dulce', 'fresco'],
    topNotes: ['Pera', 'Melón', 'Magnolia', 'Durazno', 'Mandarina', 'Bergamota'],
    heartNotes: ['Jazmín', 'Lirio de los valles', 'Tuberosa', 'Fresia', 'Rosa', 'Orquídea', 'Ciruela', 'Violeta'],
    baseNotes: ['Almizcle', 'Vainilla', 'Cedro', 'Zarzamora'],
    season: 'Primavera / Verano / Todo el año',
    occasion: 'Bodas, eventos elegantes y momentos especiales',
    intensity: 'Moderada'
  },
  '26': {
    family: 'Cítrica Aromática',
    accords: ['cítrico', 'aromático', 'verde', 'fresco especiado', 'afrutado'],
    topNotes: ['Menta', 'Bergamota', 'Pomelo', 'Lavanda'],
    heartNotes: ['Manzana verde', 'Arándano rojo', 'Rosa amarilla'],
    baseNotes: ['Flor del algodonero', 'Cactus', 'Ámbar'],
    season: 'Primavera / Verano',
    occasion: 'Uso diario relajado, deportes y paseos',
    intensity: 'Moderada'
  },
  '27': {
    family: 'Floral Aldehídica',
    accords: ['aldehídico', 'atalcado', 'floral blanco', 'amaderado', 'amarillo floral'],
    topNotes: ['Aldehídos', 'Ylang-ylang', 'Neroli', 'Bergamota', 'Limón'],
    heartNotes: ['Iris', 'Jazmín', 'Rosa', 'Raíz de lirio', 'Lirio de los valles'],
    baseNotes: ['Algalia', 'Almizcle', 'Sándalo', 'Ámbar', 'Musgo de roble', 'Vainilla', 'Pachulí'],
    season: 'Otoño / Invierno / Noche',
    occasion: 'Gala, eventos formales y ocasiones cumbre',
    intensity: 'Intensa'
  },
  '28': {
    family: 'Ámbar Especiada',
    accords: ['cálido especiado', 'aromático', 'cacao', 'amaderado', 'ámbar'],
    topNotes: ['Pimienta blanca', 'Pimienta negra', 'Bergamota'],
    heartNotes: ['Salvia', 'Cedro'],
    baseNotes: ['Haba tonka', 'Cacao', 'Amberwood'],
    season: 'Otoño / Invierno / Noche',
    occasion: 'Salidas nocturnas y vida social',
    intensity: 'Intensa'
  },
  '29': {
    family: 'Floral Frutal',
    accords: ['afrutado', 'verde', 'acuático', 'fresco', 'ozónico'],
    topNotes: ['Pepino', 'Pomelo', 'Magnolia'],
    heartNotes: ['Manzana verde', 'Lirio de los valles', 'Tuberosa', 'Violeta', 'Rosa'],
    baseNotes: ['Notas amaderadas', 'Sándalo', 'Ámbar'],
    season: 'Primavera / Verano',
    occasion: 'Día a día en la ciudad y paseos casuales',
    intensity: 'Moderada'
  },
  '30': {
    family: 'Ámbar Floral',
    accords: ['cereza', 'dulce', 'almendrado', 'avainillado', 'licor'],
    topNotes: ['Cereza ácida', 'Almendra amarga', 'Licor'],
    heartNotes: ['Cereza ácida', 'Ciruela', 'Rosa turca', 'Jazmín Sambac'],
    baseNotes: ['Haba tonka', 'Vainilla', 'Bálsamo del Perú', 'Canela', 'Sándalo', 'Cedro', 'Clavo'],
    season: 'Otoño / Invierno / Noche',
    occasion: 'Citas íntimas, noche exclusiva y eventos gourmand',
    intensity: 'Intensa'
  },
  '31': {
    family: 'Chipre Floral',
    accords: ['miel', 'dulce', 'floral blanco', 'cítrico', 'caramelo'],
    topNotes: ['Naranja sanguina', 'Mandarina'],
    heartNotes: ['Miel', 'Gardenia', 'Flor de azahar', 'Jazmín', 'Melocotón'],
    baseNotes: ['Cera de abeja', 'Pachulí', 'Caramelo', 'Regaliz'],
    season: 'Otoño / Invierno / Noche',
    occasion: 'Fiestas, diversión nocturna y salidas con amigas',
    intensity: 'Intensa'
  },
  '32': {
    family: 'Ámbar Floral',
    accords: ['atalcado', 'avainillado', 'iris', 'dulce', 'cuero'],
    topNotes: ['Pomelo', 'Bergamota'],
    heartNotes: ['Iris', 'Rosa de Bulgaria', 'Praliné'],
    baseNotes: ['Vainilla', 'Cuero', 'Pachulí'],
    season: 'Todo el año / Elegancia italiana',
    occasion: 'Citas, cenas finas y uso diario refinado',
    intensity: 'Moderada'
  },
  '33': {
    family: 'Ámbar Especiada',
    accords: ['cítrico', 'aromático', 'fresco especiado', 'ambarado', 'marino'],
    topNotes: ['Pomelo', 'Jengibre', 'Bergamota'],
    heartNotes: ['Romero', 'Notas acuáticas', 'Salvia', 'Geranio'],
    baseNotes: ['Ambroxan', 'Ámbar', 'Ládano'],
    season: 'Todo el año / Exclusividad',
    occasion: 'Viajes de negocios, reuniones de alto nivel y diario premium',
    intensity: 'Intensa'
  },
  '34': {
    family: 'Ámbar Vainilla',
    accords: ['avainillado', 'ron', 'maracuyá', 'dulce', 'tropical'],
    topNotes: ['Ron', 'Maracuyá'],
    heartNotes: ['Gardenia', 'Almizcle'],
    baseNotes: ['Vainilla', 'Haba tonka'],
    season: 'Todo el año / Noche',
    occasion: 'Fiestas, discoteca y eventos nocturnos',
    intensity: 'Intensa'
  },
  '35': {
    family: 'Amaderada Aromática',
    accords: ['aromático', 'fresco especiado', 'verde', 'amaderado', 'cítrico'],
    topNotes: ['Menta', 'Notas verdes', 'Bergamota', 'Yuzu'],
    heartNotes: ['Lavanda', 'Romero', 'Hojas de violeta', 'Flor de las nieves'],
    baseNotes: ['Ciprés', 'Cedro', 'Bálsamo de abeto', 'Almizcle'],
    season: 'Primavera / Verano / Todo el año',
    occasion: 'Oficina, actividades deportivas y aire libre',
    intensity: 'Moderada'
  },
  '36': {
    family: 'Amaderada Aromática',
    accords: ['amaderado', 'cítrico', 'floral blanco', 'aromático', 'cuero'],
    topNotes: ['Pomelo', 'Romero', 'Cardamomo'],
    heartNotes: ['Ylang-ylang', 'Tuberosa'],
    baseNotes: ['Gamuza', 'Cedro de Virginia', 'Cuero', 'Vetiver'],
    season: 'Primavera / Verano',
    occasion: 'Casual diario, tenis, paseos y días cálidos',
    intensity: 'Moderada'
  },
  '37': {
    family: 'Aromática Acuática',
    accords: ['marino', 'cítrico', 'aromático', 'fresco'],
    topNotes: ['Lima', 'Limón', 'Bergamota', 'Jazmín'],
    heartNotes: ['Notas marinas', 'Romero', 'Ciclamen'],
    baseNotes: ['Cedro', 'Almizcle blanco', 'Musgo de roble'],
    season: 'Primavera / Verano',
    occasion: 'Día a día, trabajo y paseos casuales',
    intensity: 'Moderada'
  },
  '38': {
    family: 'Amaderada Aromática',
    accords: ['afrutado', 'aromático', 'tropical', 'dulce', 'amaderado'],
    topNotes: ['Mango helado', 'Salvia', 'Notas verdes'],
    heartNotes: ['Artemisia', 'Hedeona'],
    baseNotes: ['Pachulí negro', 'Sándalo', 'Haba tonka'],
    season: 'Todo el año / Noche y tarde',
    occasion: 'Salidas nocturnas, citas y reuniones con amigos',
    intensity: 'Intensa'
  },
  '39': {
    family: 'Floral Frutal',
    accords: ['afrutado', 'floral', 'cítrico', 'verde', 'fresco'],
    topNotes: ['Manzana verde', 'Mandarina italiana', 'Osmanto japonés'],
    heartNotes: ['Fresia amarilla', 'Magnolia', 'Boronia'],
    baseNotes: ['Almizcle blanco', 'Iris'],
    season: 'Primavera / Verano',
    occasion: 'Universidad, paseos y días soleados',
    intensity: 'Moderada'
  },
  '40': {
    family: 'Ámbar Vainilla',
    accords: ['dulce', 'avainillado', 'afrutado', 'tropical', 'atalcado'],
    topNotes: ['Orquídea', 'Heliotropo', 'Mandarina'],
    heartNotes: ['Acorde goloso', 'Frutas tropicales'],
    baseNotes: ['Vainilla', 'Almizcle', 'Sándalo'],
    season: 'Todo el año / Dulzura cremosa',
    occasion: 'Día a día, salidas y momentos acogedores',
    intensity: 'Intensa'
  },
  '41': {
    family: 'Floral Frutal Gourmand',
    accords: ['tropical', 'mango', 'dulce', 'afrutado', 'avainillado', 'coco'],
    topNotes: ['Mango', 'Coco', 'Maracuyá'],
    heartNotes: ['Jazmín', 'Heliotropo', 'Flor de azahar'],
    baseNotes: ['Vainilla', 'Cachemira', 'Almizcle'],
    season: 'Primavera / Verano / Días cálidos',
    occasion: 'Playa, paseos veraniegos y ocasiones alegres',
    intensity: 'Intensa'
  },
  '42': {
    family: 'Ámbar Floral',
    accords: ['floral', 'pachulí', 'dulce', 'cálido especiado', 'atalcado'],
    topNotes: ['Té', 'Bergamota', 'Osmanto'],
    heartNotes: ['Orquídea', 'Jazmín Sambac', 'Rosa', 'Fresia', 'Flor de azahar'],
    baseNotes: ['Pachulí', 'Almizcle', 'Vainilla'],
    season: 'Otoño / Invierno / Primavera fresca',
    occasion: 'Citas románticas, fiestas y cenas formales',
    intensity: 'Intensa'
  },
  '43': {
    family: 'Ámbar Vainilla',
    accords: ['café', 'avainillado', 'dulce', 'cálido especiado', 'floral blanco'],
    topNotes: ['Pera', 'Pimienta rosa', 'Flor de azahar del naranjo'],
    heartNotes: ['Café', 'Jazmín', 'Almendra amarga', 'Regaliz'],
    baseNotes: ['Vainilla', 'Pachulí', 'Cedro', 'Madera de cachemira'],
    season: 'Otoño / Invierno / Noche',
    occasion: 'Salidas nocturnas, fiestas y citas seductoras',
    intensity: 'Intensa'
  },
  '44': {
    family: 'Amaderada Aromática',
    accords: ['cítrico', 'amaderado', 'fresco especiado', 'aromático'],
    topNotes: ['Limón de Amalfi', 'Pomelo', 'Bergamota', 'Resina de elemí'],
    heartNotes: ['Jengibre', 'Vetiver', 'Cedro de Virginia'],
    baseNotes: ['Lavanda', 'Sándalo', 'Romero'],
    season: 'Primavera / Verano',
    occasion: 'Deportes, trabajo diurno y climas cálidos',
    intensity: 'Moderada'
  },
  '45': {
    family: 'Cítrica Aromática',
    accords: ['cítrico', 'verde', 'aromático', 'fresco', 'amaderado'],
    topNotes: ['Limón', 'Notas verdes', 'Bergamota', 'Piña', 'Mandarina', 'Cardamomo', 'Papaya'],
    heartNotes: ['Lirio de los valles', 'Jazmín', 'Violeta', 'Nuez moscada', 'Rosa', 'Raíz de lirio'],
    baseNotes: ['Acorde verde', 'Almizcle', 'Cedro', 'Sándalo', 'Musgo de roble', 'Ámbar'],
    season: 'Primavera / Verano',
    occasion: 'Uso diario unisex, frescura después de la ducha',
    intensity: 'Moderada'
  },
  '46': {
    family: 'Amaderada Especiada',
    accords: ['cálido especiado', 'cítrico', 'aromático', 'fresco especiado', 'canela'],
    topNotes: ['Lima', 'Bergamota', 'Canela', 'Naranja', 'Mandarina', 'Clavo de olor', 'Nuez moscada'],
    heartNotes: ['Lavanda', 'Cilantro'],
    baseNotes: ['Almizcle', 'Pachulí', 'Sándalo', 'Cedro rojo', 'Vetiver', 'Musgo de roble'],
    season: 'Todo el año / Versátil',
    occasion: 'Oficina, salidas y uso diario con presencia',
    intensity: 'Intensa'
  },
  '47': {
    family: 'Cítrica Aromática',
    accords: ['verde', 'cítrico', 'aromático', 'fresco', 'especiado suave'],
    topNotes: ['Limón', 'Bergamota', 'Menta', 'Cáscara de naranja', 'Ruibarbo'],
    heartNotes: ['Jazmín', 'Musgo de roble', 'Hinojo', 'Almizcle', 'Clavel', 'Ámbar blanco'],
    baseNotes: ['Té verde', 'Jazmín', 'Musgo de roble', 'Almizcle', 'Semillas de apio', 'Alcaravea'],
    season: 'Primavera / Verano / Calor',
    occasion: 'Sensación de calma, trabajo en casa y días soleados',
    intensity: 'Sutil'
  },
  '48': {
    family: 'Ámbar Floral',
    accords: ['dulce', 'cacao', 'avainillado', 'afrutado', 'floral'],
    topNotes: ['Manzana', 'Nenúfar', 'Mandarina', 'Albaricoque'],
    heartNotes: ['Chocolate negro', 'Guayaba', 'Tiaré', 'Tuberosa'],
    baseNotes: ['Vainilla', 'Ámbar', 'Notas amaderadas'],
    season: 'Todo el año',
    occasion: 'Momentos románticos, juventud y diario alegre',
    intensity: 'Moderada'
  }
};
