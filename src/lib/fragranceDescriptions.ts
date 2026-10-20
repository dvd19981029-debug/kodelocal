// src/lib/fragranceDescriptions.ts
import { ProductItem } from './store';
import { FragranceProfile } from './fragranceProfiles';
import { getInspiracionPerfumeName } from './perfumeNames';

/**
 * Descripciones olfativas exclusivas y sensoriales para los 48 perfumes icónicos del catálogo.
 */
export const CATALOG_DESCRIPTIONS_48: Record<string, string> = {
  '1': 'Una composición magnética y rotundamente fresca, dominada por la jugosidad radiante de la bergamota de Calabria y la calidez ambarada y envolvente del ambroxan sobre un fondo de pimientas nobles y maderas puras.',
  '2': 'Una creación aromática amaderada intemporal y sofisticada. Destaca por su salida vibrante de cítricos frescos y menta que da paso a un corazón especiado con jengibre y un fondo profundo de incienso, cedro y sándalo.',
  '3': 'La quintaesencia de la frescura marina y mediterránea. Una brisa pura de notas marinas y cítricos vigorizantes entrelazados con matices florales suaves y un fondo limpio de almizcle blanco y madera de cedro.',
  '4': 'Una fragancia audaz, cautivadora y ahumada. Abre con un golpe cítrico y frutal de piña, limón y manzana, evolucionando hacia un corazón de abedul ahumado con rosa, asentado sobre ámbar gris, pachulí y vainilla.',
  '5': 'El epítome del lujo, el triunfo y la distinción. Combina notas jugosas de piña real y grosellas negras con la nobleza del abedul ahumado, jazmín marroquí y una base legendaria de musgo de roble y ámbar gris.',
  '6': 'Un himno radiante a la felicidad y la feminidad gourmand. El lirio pálido florece junto a la flor de azahar y el jazmín sambac, envueltos por la calidez dulce del praliné, la vainilla y el pachulí indonesio.',
  '7': 'Una explosión adictiva, cálida y golosa. Fusiona la chispa soleada de la mandarina y la naranja con un corazón cremoso de caramelo y haba tonka sobre una base rica de ámbar y madera de cedro.',
  '8': 'Una fragancia apasionada, heroica y seductora. Abre con una frescura intensa de menta, manzana verde y cáscara de limón, contrastada con la sensualidad envolvente del haba tonka, ámbar y cedro del Atlas.',
  '9': "Una oda minimalista a la serenidad y la pureza acuática. Notas de loto, rosa y ciclamen se fusionan con maderas preciosas y flores blancas para crear una sensación cristalina e inolvidable.",
  '10': 'Una leyenda de la perfumería nicho. Con un aura amaderada, ahumada y coriácea única, combina sándalo australiano, papiro y cardamomo con acordes florales de iris y violeta.',
  '11': 'Una interpretación seductora, nocturna y atrevida. El calor de la vainilla Bourbon se magnifica con el corazón floral del jazmín y un fondo resinoso y ambarado de benjuí de alta fijación.',
  '12': 'Un banquete frutal exuberante y deslumbrante. Cítricos luminosos de Sicilia dan paso a una cesta de frutas exóticas dulces, sostenida por una base hipnótica de almizcle blanco, vainilla y ámbar.',
  '13': 'La esencia de una mujer audaz y libre. Abre con chispas de naranja vibrante, revela un corazón transparente de rosa de mayo y jazmín, y sella con el refinamiento del pachulí y vetiver.',
  '14': 'La alegría de vivir del verano mediterráneo. Una salida chispeante de manzana Granny Smith y limón de Sicilia con campánula, complementada por bambú fresco, jazmín y madera de cedro.',
  '15': 'La elegancia atemporal del hombre moderno. Manzana crujiente y canela especiada se equilibran en un corazón cálido con geranio, sobre una base estructurada de sándalo, cedro y vetiver.',
  '16': 'El aroma de la victoria y el dinamismo heroico. Una colisión electrizante entre la frescura mordaz del pomelo y acordes marinos con la sensualidad amaderada de las hojas de laurel y el ámbar gris.',
  '17': 'El espíritu enérgico y cosmopolita de Londres. Una explosión deliciosa de frutos rojos —fresas, frambuesas y moras— sobre un fondo aterciopelado de violeta, jazmín, almizcle y ámbar seco.',
  '18': 'La emoción y el glamour de las mejores celebraciones exclusivas. Efervescente con notas de champán rosado y frutas rojas, sobre un corazón aterciopelado de flor de durazno y maderas reinas.',
  '19': 'La inmensidad del cielo abierto y la energía del agua. Acordes de melón jugoso, pepino fresco y mandarina dan paso a albahaca aromática y salvia, cerrando con gamuza suave y maderas transparentes.',
  '20': 'El brillo opulento del oro y la seducción descarada. Mandarina sanguina y canela ardiente se fusionan con cuero especiado, rosa y ámbar ketal en una estela inolvidable y duradera.',
  '21': 'Un clásico oriental barroco de riqueza voluptuosa. Especias cálidas, clavo, flor de azahar y rosa búlgara descansan sobre una cama suntuosa de opopónaco, benjuí, sándalo y haba tonka.',
  '22': 'Un torbellino floral inesperado y optimista. Pimienta rosa, jazmín delicado y jacinto se entrelazan con la elegancia del pachulí blanco y el almizcle en una armonía llena de movimiento.',
  '23': 'Una creación nocturna juvenil, magnética y arrolladora. Abre con manzana dulce, canela y lavanda silvestre, desembocando en un corazón avainillado y un fondo envolvente de ámbar, pachulí y haba tonka.',
  '24': 'Un tributo legendario a la figura icónica del marinero. La frescura vigorizante de la menta y la lavanda tradicional se funde con la calidez sensual de la canela, el azahar y la vainilla sedosa.',
  '25': "Un bouquet floral dorado de infinita sofisticación. La opulencia del ylang-ylang de las Comoras y la rosa damascena se une a la caricia aterciopelada del jazmín Sambac y frutas dulces.",
  '26': 'La frescura juvenil y optimista de la campiña estadounidense. Menta verde silvestre, lavanda y manzana de granja se combinan con arándanos y maderas nobles en una brisa limpia y energética.',
  '27': 'La obra maestra abstracta de la alta perfumería mundial. Un velo etéreo de aldehídos brillantes magnifica un corazón fastuoso de rosa de mayo, jazmín de Grasse, sándalo y vainilla.',
  '28': 'El magnetismo electrizante de la dualidad masculina. La chispa especiada de la pimienta blanca y negra se contrasta con la intensidad oscura del cacao tostado, haba tonka y madera de cedro.',
  '29': 'La tentación fresca y jugosa de la Gran Manzana. Manzana verde crujiente, pepino refrescante y pomelo se unen a un corazón floral de magnolia y muguete con una base limpia de sándalo y maderas claras.',
  '30': 'Un viaje voluptuoso y prohibido hacia la cereza negra licorosa. Almendra amarga y licor de cereza se funden con rosa turca, jazmín sambac, bálsamo del Perú y haba tonka tostada.',
  '31': 'La provocación gourmand más elegante y atrevida. Una sobredosis de miel dorada y cera de abejas combinada con gardenia radiante, naranja sanguina y pachulí sensual.',
  '32': 'La sofisticación y el romanticismo de la alta costura italiana. Salida luminosa de pomelo y grosella, corazón refinado de rosa y flor de melocotón, sobre un fondo suave de vainilla y pachulí.',
  '33': "Una invitación a un viaje sensorial sin límites. Jengibre chispeante y crujiente acentuado por la frescura del pomelo, notas acuáticas y un fondo magistral de ládano, ámbar y salvia.",
  '34': 'El pase exclusivo a la noche neoyorquina. Una mezcla embriagadora de fruta de la pasión exótica y ron dorado con un corazón de gardenia y una base suave de vainilla y haba tonka.',
  '35': 'El vigor y la pureza del aire alpino. Hojas de menta alpina, yuzu refrescante y bergamota se combinan con romero, lavanda de montaña y maderas de coníferas.',
  '36': 'La pureza limpia y deportiva del polo blanco. Salida cítrica con cardamomo y romero, corazón floral de nardos e ylang-ylang, sobre un fondo pulcro de cuero gamuzado, cedro y vetiver.',
  '37': 'La brisa marina revitalizante por excelencia, cargada de sales minerales, cítricos madurados al sol y un fondo limpio de almizcle y cedro.',
  '38': 'Una propuesta oscura, sensual y moderna. Mango helado jugoso combinado con salvia española, pachulí negro profundo y madera de sándalo en una firma audaz y nocturna.',
  '39': 'La energía radiante, cristalina y divertida. Manzana verde brillante, mandarina italiana y osmanto japonés sobre un corazón de magnolia y una base suave de almizcle blanco.',
  '40': 'Un sueño dulce, cremoso y ultra femenino. Acordes atalcados de orquídea, heliotropo y frutas tropicales fundidos con malvavisco dulce, vainilla gourmet y sándalo cremoso.',
  '41': 'La calidez solar de una tarde caribeña. Mango maduro, coco cremoso y maracuyá jugoso que se entrelazan con jazmín exótico, azahar y un fondo dorado de vainilla y cachemira.',
  '42': 'Una auténtica explosión floral envolvente y suntuosa. Cientos de pétalos de orquídea cattleya, jazmín sambac, fresia y rosa centifolia enriquecidos con la calidez del pachulí y la vainilla.',
  '43': 'La adicción del café negro y la noche misteriosa. La energía punzante del café tostado choca con la feminidad luminosa de las flores blancas y la sensualidad dulce de la vainilla y el cedro.',
  '44': 'Dinamismo puro, elegancia activa y distinción. Limón de Sicilia y notas aldehídicas abren el camino hacia un corazón de pimienta rosa y elemí con una base noble de cedro del Atlas y ámbar.',
  '45': 'El icono universal y revolucionario de la frescura compartida. Té verde, piña, papaya, bergamota y cardamomo dan paso a nuez moscada, violeta, rosa y un fondo limpio de almizcle y ámbar.',
  '46': 'Una fragancia vibrante, picante y altamente cumplidora. Naranja dulce, canela, lima y bergamota combinadas con clavos de olor, lavanda y una base rica de pachulí, sándalo y almizcle.',
  '47': 'La serenidad reparadora del té verde matutino. Notas efervescentes de ruibarbo, menta, cáscara de naranja y bergamota combinadas con corazón de té verde puro, jazmín y semillas de apio.',
  '48': 'La magia audaz y juvenil para mujeres auténticas. Manzana glaseada, nenúfar y chabacano se funden con chocolate oscuro, guayaba, flor de tiaré y una base dulce de vainilla y ámbar.',
  '49': 'Una concentración nocturna desbordante y adictiva. Canela cálida y cardamomo salvaje colisionan con un corazón noble de lavanda de Nyons, envueltos en un fondo suntuoso de maderas ricas, regaliz y ámbar licoroso.',
  '50': 'Una firma moderna, mineral y magnética que celebra la elegancia romana. Hojas de violeta y sal mineral se entrelazan con jengibre picante, salvia aromática y un fondo vibrante de vetiver ahumado y maderas nobles.',
  '51': 'Una inmersión profunda en el azul intenso del Mediterráneo. Notas marinas y mandarina verde se funden con ciprés, lavanda y romero sobre una estela mineral de pachulí y ámbar salino.',
  '52': 'Un elixir incandescente de seducción pura. Lavanda fresca y menta abren paso a la opulencia cremosa del benjuí y la vainilla, culminando en un fondo adictivo de miel dorada, haba tonka y tabaco.',
  '53': 'Calidez envolvente y magnetismo contemporáneo. Cardamomo especiado, pimienta rosa y hojas de violeta se unen a un corazón de salvia y canela sobre una base inconfundible de castaña glaseada y vainilla.',
  '54': 'El pulso vibrante y cosmopolita de Manhattan. Notas verdes recién cortadas, pomelo y bergamota evolucionan hacia un corazón de jengibre y gardenia sobre sándalo, incienso y almizcle transparente.',
  '55': 'Fuerza neo-oriental, carismática y audaz. Un acorde embriagador de ron especiado y tabaco luminoso da paso a cuero suave, iris y nardos sobre un fondo resinoso de benjuí, haba tonka y madera de gaiac.',
  '56': 'La sofisticación del mar cuando choca contra la roca volcánica. Acordes marinos y bergamota luminosa se funden con romero, salvia y una base mística de incienso ahumado y pachulí.',
  '57': 'Una explosión festiva de feminidad audaz y seductora. Cereza negra jugosa y almendra amarga abren paso a un bouquet opulento de rosa y azucena sobre vainilla Bourbon y vetiver.',
  '58': 'La dualidad fascinante de la mujer moderna. Almendra y café negro contrastan con la luminosidad del jazmín Sambac y el nardo, reposando sobre una base adictiva de cacao, haba tonka y vainilla.',
  '59': 'Irreverencia, elegancia especiada y seducción magnética. Pimienta rosa, pera jugosa y nuez moscada envuelven un corazón de rosa aterciopelada, clavo y magnolia sobre cashmeran y vetiver de Haití.',
  '60': 'Una alquimia luminosa, mineral y profundamente adictiva. El azafrán dorado y el jazmín aéreo se funden con el calor radiante del ámbar gris, el amberwood y la resina de abeto sobre cedro puro.',
  '61': 'La legendaria colisión de fuego, vanguardia y distinción. Una apertura fresca de mandarina siciliana, bergamota y lavanda que da paso a un corazón icónico de hojas de violeta, nuez moscada y cedro, culminando sobre una estela magnética de cuero ruso, ámbar y vetiver.',
  '62': 'Un gran bouquet floral radiante y jubiloso que celebra el amor y la feminidad. Flor de azahar, durazno y ciruela abren paso a una sinfonía opulenta de nardos, mimosa dorada, gardenia e ylang-ylang sobre sándalo, vainilla y ámbar.',
  '63': 'La estrella pionera de la alta perfumería gourmand. Algodón de azúcar, frutos rojos, miel y melón se funden en una estela celestial de chocolate oscuro, caramelo, vainilla y pachulí hipnótico.',
  '64': 'Un abrazo cálido, sensual y envolvente de vainilla dorada. Pétalos azucarados y mandarina jugosa acarician un corazón cremoso de cacao y especias suaves sobre haba tonka, ámbar y maderas limpias.',
  '65': 'El misterio seductor de la noche en una poción adictiva. Un acorde vibrante de martini de manzana y hojas de violeta despierta un corazón ardiente de canela y lavanda sobre cuero sexy, ámbar y vainilla.',
  '66': 'La reinvención nicho y ultralimpia de la lavanda francesa. Bergamota luminosa y neroli puro elevan una lavanda destilada verticalmente sobre un fondo impecable de almizcle blanco, ámbar y haba tonka.',
  '67': 'Vanguardia floral y sofisticación milanesa. Pera jugosa y bergamota iluminan un corazón radiante de flor de azahar, neroli y jazmín Sambac, envueltos en la calidez sensual de la vainilla Bourbon, ámbar y benjuí.',
  '68': 'Espíritu libre, fresco y luminoso. Manzano en flor, camelia blanca y mandarina chispeante se entrelazan con menta fresca, madreselva y rosa sobre un fondo limpio de magnolia, cedro y sándalo.',
  '69': 'Una creación audaz, crujiente y aristocrática. El frescor ácido y vibrante del ruibarbo rojo recién cortado se suaviza con frutos rojos jugosos y se funde en un velo sedoso de almizcle blanco.',
  '70': 'Una fantasía floral aérea y luminosa. Pétalos de flor del cerezo bañados por el sol y mandarina fresca dan paso a un corazón delicado de rosa, violeta y lila sobre bambú verde, sándalo y almizcle.',
  '71': 'Opulencia gourmand en estado puro. Una tentación exquisita de chocolate negro, cacao tostado y canela que se funde con caramelo líquido, avellana y leche tibia sobre un fondo regio de vainilla, haba tonka y ámbar.',
  '72': 'El icono legendario de la frescura oceánica. Una ola vigorizante de agua de mar, menta, lavanda y romero que rompe sobre un corazón aromático de neroli y geranio con fondo de musgo de roble, cedro y almizcle.',
  '73': 'Carácter clásico, viril e inconfundible. Lavanda fresca, limón, verbena y romero abren paso a bayas de enebro, cilantro y canela, reposando sobre una base poderosa de cuero, musgo de roble, pino y vetiver.',
  '74': 'Elegancia eterna, pulcra y equilibrada. Mandarina, lavanda y bergamota dan paso a un corazón botánico de salvia, albahaca, enebro y geranio, sellado con sándalo cálido, vetiver y palo de rosa.',
  '75': 'La fuerza indomable del océano oscuro. Salvia aromática y romero se sumergen en acordes de sal marina, cashmeran y maderas oscuras, cerrando con humo misterioso, cuero, haba tonka y vainilla de Madagascar.',
  '76': 'El emblema del caballero carismático y seguro. Una salida vibrante de piña, lavanda y bergamota evoluciona hacia manzana roja, geranio y musgo de roble sobre un fondo seductor de haba tonka y sándalo.',
  '77': 'Majestuosidad oriental e imponente presencia real. El oro rojo del azafrán y la nuez moscada coronan un corazón magnético de madera de oud sagrada y pachulí sobre almizcle oscuro de altísima fijación.',
  '78': 'Magnetismo nocturno y energía futurista. Cardamomo especiado, ruibarbo vibrante y bergamota encienden una lavanda intensa que descansa sobre vainilla negra, bálsamo de Tolú y vetiver de Haití.',
  '79': 'Energía atlética y frescura impecable. Menta helada, aldehídos, mandarina y lavanda se combinan con notas marinas y jengibre sobre una base limpia de almizcle, sándalo y cedro.',
  '80': 'La pureza cristalina de los manantiales alpinos suizos. Bergamota y mandarina abren paso a un acorde vigorizante de té verde puro y grosellas negras sobre almizcle blanco, petit grain y sándalo.',
  '81': 'Lujo indómito, sensual y profundamente sofisticado. La dulzura inesperada de la frambuesa y el azafrán ilumina un acorde magistral de cuero toscano fino, gamuza aterciopelada, olíbano ahumado y ámbar.',
  '82': 'La energía dorada del atardecer en Roma. Manzana roja crujiente y cardamomo contrastan con lavanda aromática y geranio, culminando en una estela adictiva y cálida de hoja de tabaco, pachulí y vetiver.'
};

/**
 * Obtiene la descripción detallada, específica y personalizada para cualquier fragancia.
 */
export function getFragranceDescription(product: ProductItem, profile?: FragranceProfile | null): string {
  const sku = String(product.sku || (product as any).kodigo || '').trim();
  
  // 1. Coincidencia directa con los 48 perfumes del catálogo
  if (sku && CATALOG_DESCRIPTIONS_48[sku]) {
    return CATALOG_DESCRIPTIONS_48[sku];
  }

  const inspiracionName = getInspiracionPerfumeName(product) || product.officialName || product.name;

  // 2. Si existe un perfil con notas olfativas, construir una narrativa profesional y fluida
  if (profile) {
    const family = profile.family || 'Fragancia Fina';
    const top = profile.topNotes && profile.topNotes.length > 0 ? profile.topNotes.slice(0, 3).join(', ') : '';
    const heart = profile.heartNotes && profile.heartNotes.length > 0 ? profile.heartNotes.slice(0, 3).join(', ') : '';
    const base = profile.baseNotes && profile.baseNotes.length > 0 ? profile.baseNotes.slice(0, 3).join(', ') : '';

    const parts: string[] = [];
    parts.push(`Inspirada en ${inspiracionName}. Esta fragancia pertenece a la selecta familia olfativa ${family}.`);

    if (top && heart && base) {
      parts.push(`Abre con un estallido fresco de ${top.toLowerCase()}, evoluciona hacia un corazón envolvente dominado por ${heart.toLowerCase()}, y reposa sobre una base profunda de ${base.toLowerCase()}.`);
    } else if (top && base) {
      parts.push(`Destaca por su apertura radiante con notas de ${top.toLowerCase()} y su elegante fijación en maderas y resinas de ${base.toLowerCase()}.`);
    }

    parts.push('Formulada con aceites concentrados de alta perfumería francesa para asegurar una estela distinguida y prolongada.');
    return parts.join(' ');
  }

  // 3. Fallback personalizado con el nombre de inspiración
  return `Inspirada en ${inspiracionName}. Perfil olfativo de alta perfumería francesa formulado con aceites puros de máxima concentración, garantizando una fijación duradera y una proyección equilibrada.`;
}
