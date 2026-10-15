import { KSHIRA_POS, SHIVA_SEAT, Y, type Vec3 } from './layout'

export type RealmId =
  | 'brahmanda'
  | 'vaikuntha'
  | 'satya'
  | 'tapa'
  | 'jana'
  | 'mahar'
  | 'svarga'
  | 'bhuvar'
  | 'bhu'
  | 'kailash'
  | 'kshira'
  | 'atala'
  | 'vitala'
  | 'sutala'
  | 'talatala'
  | 'mahatala'
  | 'rasatala'
  | 'patala'
  | 'yama'

export type RealmGroup = 'cosmos' | 'beyond' | 'upper' | 'earth' | 'lower'

export interface Verse {
  devanagari: string
  iast: string
  translation: string
  source: string
}

export interface Realm {
  id: RealmId
  /** Common English spelling */
  name: string
  /** Scholarly transliteration */
  iast: string
  devanagari: string
  epithet: string
  group: RealmGroup
  tier: string
  deities: string[]
  description: string[]
  facts: string[]
  verse?: Verse
  /** Paraphrase with a scripture reference, used where no verse is quoted. */
  textNote?: { text: string; source: string }
  accent: string
  /** Camera orbit target */
  focus: Vec3
  /** Camera position relative to focus on arrival */
  view: Vec3
  orbit: { min: number; max: number; minPolar?: number; maxPolar?: number }
  label: { at: Vec3; range: number }
  /** Ambient drone colour: 0 = dark/low, 1 = bright/high */
  tone: number
}

const lower = (
  id: RealmId,
  y: number,
  data: Omit<Realm, 'id' | 'focus' | 'view' | 'orbit' | 'label' | 'group'> & { labelRange?: number },
): Realm => ({
  id,
  group: 'lower',
  focus: [0, y + 3, 0],
  view: [0, 34, 88],
  orbit: { min: 12, max: 98, minPolar: 1.05, maxPolar: 1.52 },
  label: { at: [0, y + 10, 150], range: data.labelRange ?? 950 },
  ...data,
})

export const REALMS: Record<RealmId, Realm> = {
  brahmanda: {
    id: 'brahmanda',
    name: 'Brahmanda',
    iast: 'Brahmāṇḍa',
    devanagari: 'ब्रह्माण्ड',
    epithet: 'The Cosmic Egg',
    group: 'cosmos',
    tier: 'The whole universe',
    deities: ['Garbhodakaśāyī Viṣṇu', 'Brahmā'],
    description: [
      'In Purāṇic cosmology the universe is a golden egg, the Brahmāṇḍa. Seven sheaths enclose it: earth, water, fire, air, ether, mahat and ahaṅkāra. Inside, fourteen worlds are stacked along the axis of Mount Meru.',
      'Above the egg, across the shining river Virajā, lies Vaikuṇṭha, the eternal abode of Viṣṇu. The texts say countless such eggs float in the Causal Ocean, each with its own Brahmā.',
    ],
    facts: [
      '14 lokas: 7 upper (Bhū to Satya) and 7 lower (Atala to Pātāla)',
      'The lower part of the egg holds the Garbhodaka ocean',
      'The Gaṅgā enters at the top of the egg and descends to Meru',
      'Purāṇas differ in detail; this map mostly follows the Bhāgavata',
    ],
    verse: {
      devanagari: 'आब्रह्मभुवनाल्लोकाः पुनरावर्तिनोऽर्जुन ।\nमामुपेत्य तु कौन्तेय पुनर्जन्म न विद्यते ॥',
      iast: 'ā-brahma-bhuvanāl lokāḥ punar āvartino ’rjuna\nmām upetya tu kaunteya punar janma na vidyate',
      translation:
        'All worlds up to the realm of Brahmā are places of return, O Arjuna. Whoever reaches Me, O son of Kuntī, is not born again.',
      source: 'Bhagavad Gītā 8.16',
    },
    accent: '#e8b84a',
    focus: [0, 200, 0],
    view: [1280, 290, 2070],
    orbit: { min: 500, max: 7000 },
    label: { at: [0, 0, 0], range: 0 },
    tone: 0.55,
  },

  vaikuntha: {
    id: 'vaikuntha',
    name: 'Vaikuntha',
    iast: 'Vaikuṇṭha',
    devanagari: 'वैकुण्ठ',
    epithet: 'The Abode of Viṣṇu',
    group: 'beyond',
    tier: 'Beyond the cosmic egg',
    deities: ['Śrī Viṣṇu (Nārāyaṇa)', 'Śrī Lakṣmī', 'Garuḍa', 'Jaya & Vijaya'],
    description: [
      'Vaikuṇṭha means “free from anxiety, without limit”. It is Viṣṇu’s eternal realm and lies beyond the cosmic egg on the far side of the river Virajā. It shines with its own light, so it needs no sun, moon or fire.',
      'The Bhāgavata (Canto 3) describes its vimānas (celestial airships), its gardens of wish-fulfilling trees, and residents who share Viṣṇu’s four-armed form. Jaya and Vijaya guard the seventh gate.',
    ],
    facts: [
      'It lies outside the material universe, across the Virajā river',
      'Its residents share Viṣṇu’s form (sārūpya mukti)',
      'The four Kumāras cursed the gatekeepers Jaya and Vijaya (BP 3.15–16)',
      'Lakṣmī serves Nārāyaṇa eternally',
    ],
    verse: {
      devanagari: 'न तद्भासयते सूर्यो न शशाङ्को न पावकः ।\nयद्गत्वा न निवर्तन्ते तद्धाम परमं मम ॥',
      iast: 'na tad bhāsayate sūryo na śaśāṅko na pāvakaḥ\nyad gatvā na nivartante tad dhāma paramaṁ mama',
      translation:
        'No sun, no moon and no fire lights it. Those who reach it do not return. That is My supreme abode.',
      source: 'Bhagavad Gītā 15.6',
    },
    accent: '#7fb2ff',
    focus: [0, Y.vaikuntha + 8, 0],
    view: [0, 70, 118],
    orbit: { min: 5, max: 900 },
    label: { at: [0, Y.vaikuntha + 45, 0], range: 6000 },
    tone: 0.95,
  },

  satya: {
    id: 'satya',
    name: 'Satyaloka',
    iast: 'Satyaloka (Brahmaloka)',
    devanagari: 'सत्यलोक',
    epithet: 'The Realm of Brahmā',
    group: 'upper',
    tier: '7th upper world, the summit of the egg',
    deities: ['Brahmā', 'Sarasvatī', 'Haṁsa (the swan)'],
    description: [
      'Satyaloka, the World of Truth, is the highest world inside the cosmic egg. It is the seat of Brahmā, the creator, who was born on a lotus from Viṣṇu’s navel and whose four faces spoke the four Vedas.',
      'When a day of Brahmā ends, the three lower worlds dissolve, but Satyaloka lasts until the great dissolution (mahāpralaya). Many of its residents are liberated together with Brahmā at the end of his life.',
    ],
    facts: [
      'One day of Brahmā lasts 1,000 mahā-yugas, about 4.32 billion years',
      'Sarasvatī, goddess of learning, is his consort',
      'Brahmā rides a haṁsa (swan)',
      'Even this realm is not eternal (Gītā 8.16)',
    ],
    verse: {
      devanagari: 'सहस्रयुगपर्यन्तमहर्यद्ब्रह्मणो विदुः ।\nरात्रिं युगसहस्रान्तां तेऽहोरात्रविदो जनाः ॥',
      iast: 'sahasra-yuga-paryantam ahar yad brahmaṇo viduḥ\nrātriṁ yuga-sahasrāntāṁ te ’ho-rātra-vido janāḥ',
      translation:
        'Those who know that a day of Brahmā lasts a thousand ages, and his night another thousand, truly understand day and night.',
      source: 'Bhagavad Gītā 8.17',
    },
    accent: '#ffcf6b',
    focus: [0, Y.satya + 8, 0],
    view: [0, 42, 78],
    orbit: { min: 4, max: 500 },
    label: { at: [0, Y.satya + 34, 0], range: 4200 },
    tone: 0.9,
  },

  tapa: {
    id: 'tapa',
    name: 'Tapoloka',
    iast: 'Tapoloka',
    devanagari: 'तपोलोक',
    epithet: 'The World of Austerity',
    group: 'upper',
    tier: '6th upper world',
    deities: ['Perfected ascetics (the Vairājas)'],
    description: [
      'Tapoloka takes its name from tapas, the inner fire of austerity. Ascetics who have mastered themselves live here in deep meditation.',
      'When the fires at the end of a kalpa sweep through the lower worlds, they cannot touch the residents of Tapoloka.',
    ],
    facts: [
      'Tapas means austerity, the heat that spiritual discipline produces',
      'It survives the partial dissolution at the end of Brahmā’s day',
      'It lies between Janaloka and Satyaloka',
    ],
    textNote: {
      text: 'Above Janaloka is Tapoloka, home of the Vairāja deities, whom fire cannot burn.',
      source: 'cf. Viṣṇu Purāṇa 2.7',
    },
    accent: '#ff9d4a',
    focus: [0, Y.tapa + 2, 0],
    view: [0, 46, 112],
    orbit: { min: 8, max: 420 },
    label: { at: [0, Y.tapa + 18, 60], range: 1300 },
    tone: 0.8,
  },

  jana: {
    id: 'jana',
    name: 'Janaloka',
    iast: 'Janaloka',
    devanagari: 'जनलोक',
    epithet: 'The World of the Mind-born Sages',
    group: 'upper',
    tier: '5th upper world',
    deities: ['The four Kumāras: Sanaka, Sanandana, Sanātana, Sanat-kumāra'],
    description: [
      'Janaloka is home to the sons Brahmā created from his mind. Among them are the four Kumāras, who vowed lifelong celibacy and remain forever in the form of five-year-old boys.',
      'At the end of each kalpa, the fire that burns the three worlds drives the sages of Maharloka upward, and they take refuge in Janaloka.',
    ],
    facts: [
      'The Kumāras chose to remain children devoted to knowledge',
      'Their visit to Vaikuṇṭha set the story of Jaya and Vijaya in motion (BP 3.15)',
      'It is a refuge during the partial dissolution',
    ],
    textNote: {
      text: 'When the three worlds blaze at the end of the day of Brahmā, the residents of Maharloka, troubled by the heat, rise to Janaloka.',
      source: 'cf. Bhāgavata Purāṇa 3.11',
    },
    accent: '#8fd3ff',
    focus: [0, Y.jana + 2, 0],
    view: [0, 40, 98],
    orbit: { min: 6, max: 420 },
    label: { at: [0, Y.jana + 16, 60], range: 1300 },
    tone: 0.78,
  },

  mahar: {
    id: 'mahar',
    name: 'Maharloka',
    iast: 'Maharloka',
    devanagari: 'महर्लोक',
    epithet: 'The World of the Great Sages',
    group: 'upper',
    tier: '4th upper world',
    deities: ['Bhṛgu and the great ṛṣis'],
    description: [
      'Maharloka lies above Dhruva, the pole star. Great sages such as Bhṛgu live here for an entire kalpa.',
      'It escapes destruction at the end of Brahmā’s day, though the heat of that fire still drives its residents up to Janaloka.',
    ],
    facts: [
      'It lies just above the pole star and the Saptarṣi (seven sages)',
      'Its residents live for a full kalpa',
      'It is the lowest of the four worlds that outlast Brahmā’s night',
    ],
    textNote: {
      text: 'Above Dhruva lies Maharloka, whose inhabitants endure for a kalpa.',
      source: 'cf. Viṣṇu Purāṇa 2.7',
    },
    accent: '#b79bff',
    focus: [0, Y.mahar + 2, 0],
    view: [0, 40, 100],
    orbit: { min: 6, max: 420 },
    label: { at: [0, Y.mahar + 16, 60], range: 1300 },
    tone: 0.72,
  },

  svarga: {
    id: 'svarga',
    name: 'Svarga',
    iast: 'Svarga · Amarāvatī',
    devanagari: 'स्वर्ग',
    epithet: 'Heaven: The City of Indra',
    group: 'upper',
    tier: '3rd upper world (Svar-loka)',
    deities: ['Indra', 'Śacī', 'The devas', 'Apsarās & gandharvas'],
    description: [
      'Svarga is the heaven of the devas. Indra rules it from his capital, Amarāvatī, home to the Sudharmā assembly hall, the Nandana gardens and the wish-fulfilling Pārijāta tree. The celestial Gaṅgā flows through it as the Mandākinī.',
      'Svarga is a place of reward, not liberation. Souls who earn it by their merit return to Earth once that merit is used up.',
    ],
    facts: [
      'Airāvata, the white elephant, is Indra’s mount',
      'The rainbow is called Indra-dhanuṣ, “Indra’s bow”',
      'Apsarās such as Urvaśī and Menakā dance in Indra’s court',
      'Indra wields the vajra, the thunderbolt',
    ],
    verse: {
      devanagari:
        'ते तं भुक्त्वा स्वर्गलोकं विशालं\nक्षीणे पुण्ये मर्त्यलोकं विशन्ति ।\nएवं त्रयीधर्ममनुप्रपन्ना\nगतागतं कामकामा लभन्ते ॥',
      iast: 'te taṁ bhuktvā svarga-lokaṁ viśālaṁ\nkṣīṇe puṇye martya-lokaṁ viśanti\nevaṁ trayī-dharmam anuprapannā\ngatāgataṁ kāma-kāmā labhante',
      translation:
        'After enjoying the vast heavenly world, they return to the world of mortals when their merit runs out. So those who follow the Vedic rites for the sake of desires keep coming and going.',
      source: 'Bhagavad Gītā 9.21',
    },
    accent: '#ffd36e',
    focus: [0, Y.svarga + 4, 0],
    view: [0, 62, 118],
    orbit: { min: 6, max: 650 },
    label: { at: [0, Y.svarga + 34, 0], range: 4200 },
    tone: 0.85,
  },

  bhuvar: {
    id: 'bhuvar',
    name: 'Bhuvarloka',
    iast: 'Bhuvarloka',
    devanagari: 'भुवर्लोक',
    epithet: 'The Sky Between Worlds',
    group: 'upper',
    tier: '2nd upper world',
    deities: ['Sūrya', 'Candra', 'The Navagrahas', 'Siddhas & vidyādharas'],
    description: [
      'Bhuvarloka is the airy region between the Earth and the sun. Siddhas, cāraṇas and vidyādharas travel through it, with yakṣas and rākṣasas below them. At its top the sun drives his one-wheeled chariot around Mount Meru, so one side of the Earth-disc has day while the other has night.',
      'Above the sun the Bhāgavata places the moon, then the 28 nakṣatras, then Venus, Mercury, Mars, Jupiter and Saturn, then the seven sages. At the very top is Dhruva, the pole star, the pivot around which all of them turn.',
    ],
    facts: [
      'The sun’s chariot wheel has 12 spokes, one for each month (BP 5.21)',
      'Rāhu, the shadow planet, moves below the sun',
      'Day and night come from the sun circling Meru',
      'The Gāyatrī names three worlds: bhūḥ, bhuvaḥ, svaḥ',
    ],
    verse: {
      devanagari: 'ॐ भूर्भुवः स्वः ।\nतत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि ।\nधियो यो नः प्रचोदयात् ॥',
      iast: 'oṁ bhūr bhuvaḥ svaḥ\ntat savitur vareṇyaṁ bhargo devasya dhīmahi\ndhiyo yo naḥ pracodayāt',
      translation:
        'Om. Earth, sky, heaven. We meditate on the glorious radiance of the divine Savitṛ, the Sun. May it awaken our minds.',
      source: 'Ṛgveda 3.62.10 (Gāyatrī), with the vyāhṛtis',
    },
    accent: '#ffb347',
    focus: [0, 125, 0],
    view: [330, 95, 430],
    orbit: { min: 60, max: 1600 },
    label: { at: [0, Y.sun + 20, 232], range: 2300 },
    tone: 0.7,
  },

  bhu: {
    id: 'bhu',
    name: 'Bhuloka',
    iast: 'Bhūloka · Bhū-maṇḍala',
    devanagari: 'भूलोक',
    epithet: 'Dharti, the Earth',
    group: 'earth',
    tier: '1st upper world, home of humans',
    deities: ['Bhūdevī (Mother Earth)'],
    description: [
      'The Purāṇas describe the Earth as Bhū-maṇḍala, a vast disc. At its center is Jambūdvīpa with golden Mount Meru. Around it lie seven ring-shaped continents (dvīpas), separated by seven oceans of salt water, sugarcane juice, wine, ghee, milk, yogurt and sweet water.',
      'Bhārata-varṣa, the land of karma, lies in the south of Jambūdvīpa below the Himālaya. At the rim, the Lokāloka mountain divides the lit world from the darkness beyond. Some modern scholars read Bhū-maṇḍala as a model of the planetary plane rather than a map of the globe.',
    ],
    facts: [
      'Meru is wider at its summit than at its base, like a lotus seed-pod',
      'The Gaṅgā falls on Meru and divides into four rivers',
      'The ocean of milk (Kṣīra Sāgara) is the fifth ocean',
      'The order of the oceans differs slightly between Purāṇas',
    ],
    verse: {
      devanagari: 'माता भूमिः पुत्रो अहं पृथिव्याः ।',
      iast: 'mātā bhūmiḥ putro ahaṁ pṛthivyāḥ',
      translation: 'The Earth is my mother; I am her child.',
      source: 'Atharvaveda 12.1.12 (Bhūmi Sūkta)',
    },
    accent: '#7fd38b',
    focus: [0, 0, 0],
    view: [0, 300, 400],
    orbit: { min: 25, max: 1800 },
    label: { at: [0, 30, 262], range: 6000 },
    tone: 0.6,
  },

  kailash: {
    id: 'kailash',
    name: 'Mount Kailash',
    iast: 'Kailāsa',
    devanagari: 'कैलास',
    epithet: 'The Abode of Śiva and Pārvatī',
    group: 'earth',
    tier: 'In the Himālaya, Jambūdvīpa',
    deities: ['Śiva', 'Pārvatī', 'Nandī'],
    description: [
      'Kailāsa is Śiva’s home. Here he sits in meditation with Pārvatī beside him, the crescent moon and the river Gaṅgā held in his matted locks, while his bull Nandī waits in front of them.',
      'The real mountain rises 6,638 m in western Tibet, near the lakes Mānasarovara and Rākṣastāl. Hindus, Buddhists, Jains and followers of Bön all hold it sacred. By custom no one climbs it; pilgrims walk the 52 km circuit around it (parikramā).',
    ],
    facts: [
      'Tibetan tradition says its four faces are crystal, ruby, gold and lapis lazuli',
      'The Gaṅgā fell into Śiva’s locks so her descent would not shatter the Earth',
      'Mānasarovara, the “lake of the mind”, was born from Brahmā’s mind',
      'Śiva and Pārvatī are worshipped together as the parents of the world',
    ],
    verse: {
      devanagari: 'वागर्थाविव सम्पृक्तौ वागर्थप्रतिपत्तये ।\nजगतः पितरौ वन्दे पार्वतीपरमेश्वरौ ॥',
      iast: 'vāg-arthāv iva sampṛktau vāg-artha-pratipattaye\njagataḥ pitarau vande pārvatī-parameśvarau',
      translation:
        'So that I may grasp both word and meaning, I bow to Pārvatī and Parameśvara, the parents of the world, joined to each other as closely as a word and its meaning.',
      source: 'Kālidāsa, Raghuvaṁśa 1.1',
    },
    accent: '#a9d8ff',
    focus: [SHIVA_SEAT.x, SHIVA_SEAT.h + 1.0, SHIVA_SEAT.z - 0.9],
    view: [2.2, 2.4, 9.6],
    orbit: { min: 2.2, max: 140, maxPolar: 1.45 },
    label: { at: [SHIVA_SEAT.x, 8, SHIVA_SEAT.z - 2], range: 760 },
    tone: 0.5,
  },

  kshira: {
    id: 'kshira',
    name: 'Kshira Sagara',
    iast: 'Kṣīra Sāgara',
    devanagari: 'क्षीरसागर',
    epithet: 'The Ocean of Milk',
    group: 'earth',
    tier: '5th ocean of Bhū-maṇḍala',
    deities: ['Viṣṇu (Anantaśayana)', 'Lakṣmī', 'Ananta Śeṣa', 'Brahmā'],
    description: [
      'In the Ocean of Milk, Viṣṇu reclines on the coils of Ananta Śeṣa, the endless serpent, while Lakṣmī serves at his feet. A lotus grows from his navel, and Brahmā sits on it. In times of crisis the devas come to the shore here to pray.',
      'In the Samudra Manthan, devas and asuras churned this ocean with Mount Mandara as the rod and Vāsuki as the rope. It yielded amṛta, Lakṣmī, the Pārijāta tree and Airāvata, and also the poison hālāhala, which Śiva drank.',
    ],
    facts: [
      'Viṣṇu’s reclining posture is called Anantaśayana',
      'The white island Śvetadvīpa lies within this ocean',
      'Viṣṇu became Kūrma, the tortoise, to hold up Mount Mandara',
      'The poison turned Śiva’s throat blue, giving him the name Nīlakaṇṭha',
    ],
    verse: {
      devanagari:
        'शान्ताकारं भुजगशयनं पद्मनाभं सुरेशं\nविश्वाधारं गगनसदृशं मेघवर्णं शुभाङ्गम् ।\nलक्ष्मीकान्तं कमलनयनं योगिभिर्ध्यानगम्यं\nवन्दे विष्णुं भवभयहरं सर्वलोकैकनाथम् ॥',
      iast: 'śāntākāraṁ bhujaga-śayanaṁ padma-nābhaṁ sureśaṁ\nviśvādhāraṁ gagana-sadṛśaṁ megha-varṇaṁ śubhāṅgam\nlakṣmī-kāntaṁ kamala-nayanaṁ yogibhir dhyāna-gamyaṁ\nvande viṣṇuṁ bhava-bhaya-haraṁ sarva-lokaika-nātham',
      translation:
        'I bow to Viṣṇu. Calm in form, he rests on the serpent, a lotus springs from his navel, and he is lord of the gods. He supports the universe, is vast as the sky, dark as a rain cloud and fair of limb. He is Lakṣmī’s beloved, lotus-eyed, reached by yogis in meditation. He takes away the fear of worldly life and is the one Lord of all worlds.',
      source: 'Viṣṇu dhyāna śloka (traditional)',
    },
    accent: '#e9f1ff',
    focus: [KSHIRA_POS[0], 1.6, KSHIRA_POS[2]],
    view: [7, 8, 14],
    orbit: { min: 4, max: 260, maxPolar: 1.5 },
    label: { at: [KSHIRA_POS[0], 12, KSHIRA_POS[2]], range: 760 },
    tone: 0.75,
  },

  atala: lower('atala', Y.atala, {
    name: 'Atala',
    iast: 'Atala',
    devanagari: 'अतल',
    epithet: 'The Realm of Illusion',
    tier: '1st lower world',
    deities: ['Bala, son of Maya'],
    description: [
      'Atala is the first of the seven worlds below the Earth. Bala, a son of the asura architect Maya, rules it. He is the master of ninety-six kinds of illusion (māyā).',
      'The Bhāgavata says all the lower worlds outshine heaven in comfort. They have gem-lit palaces and gardens, there is no day or night, and no one fears old age or disease.',
    ],
    facts: [
      'No sunlight reaches it; jewels light the realm',
      'Bala created 96 kinds of magic',
      'The lower worlds are said to be richer than Svarga',
    ],
    textNote: {
      text: 'In Atala lives Bala, son of Maya, who created ninety-six kinds of māyā.',
      source: 'cf. Bhāgavata Purāṇa 5.24.16',
    },
    accent: '#c58bff',
    tone: 0.38,
  }),

  vitala: lower('vitala', Y.vitala, {
    name: 'Vitala',
    iast: 'Vitala',
    devanagari: 'वितल',
    epithet: 'The Realm of Hāṭakeśvara',
    tier: '2nd lower world',
    deities: ['Hara-Bhava (Śiva as Hāṭakeśvara)', 'Bhavānī'],
    description: [
      'In Vitala, Śiva lives as Hāṭakeśvara, the Lord of Gold, with Bhavānī and his attendants.',
      'The river Hāṭakī flows here, and from it comes hāṭaka, a gold the residents wear as ornaments.',
    ],
    facts: [
      'Śiva lives here as Hāṭakeśvara',
      'The river Hāṭakī yields a special gold',
      'Bhūtas and other spirits attend him',
    ],
    textNote: {
      text: 'In Vitala, Lord Hara lives as Hāṭakeśvara with Bhavānī, and the river Hāṭakī yields gold.',
      source: 'cf. Bhāgavata Purāṇa 5.24.17',
    },
    accent: '#ffc94a',
    tone: 0.36,
  }),

  sutala: lower('sutala', Y.sutala, {
    name: 'Sutala',
    iast: 'Sutala',
    devanagari: 'सुतल',
    epithet: 'The Kingdom of Bali',
    tier: '3rd lower world',
    deities: ['Bali Mahārāja', 'Vāmana (Viṣṇu) at the gate'],
    description: [
      'Sutala is the kingdom of Bali, the generous asura king. When Vāmana, Viṣṇu’s dwarf avatar, asked him for three steps of land, Bali gave up the whole universe.',
      'Moved by his devotion, Viṣṇu made Bali king of Sutala, a world richer than heaven, and stands at his gate himself as doorkeeper, club in hand.',
    ],
    facts: [
      'Bali gave away the three worlds to Vāmana',
      'Viṣṇu acts as Bali’s doorkeeper',
      'Bali is one of the seven Chiranjīvīs (immortals)',
      'Kerala’s Onam festival celebrates Bali’s yearly visit',
    ],
    textNote: {
      text: 'In Sutala lives Bali, and the Lord himself guards his door.',
      source: 'cf. Bhāgavata Purāṇa 5.24.18; 8.22',
    },
    accent: '#7ee0c3',
    tone: 0.36,
  }),

  talatala: lower('talatala', Y.talatala, {
    name: 'Talatala',
    iast: 'Talātala',
    devanagari: 'तलातल',
    epithet: 'The Realm of Maya the Architect',
    tier: '4th lower world',
    deities: ['Maya Dānava'],
    description: [
      'Talātala is ruled by Maya Dānava, the great architect of the asuras. He built Tripura, three flying cities of gold, silver and iron, which Śiva destroyed with a single arrow.',
      'Śiva spared Maya and gave him this kingdom, where he still lives under Śiva’s protection.',
    ],
    facts: [
      'Maya built Tripura, the three cities',
      'Śiva as Tripurāntaka destroyed them',
      'Maya also built the Pāṇḍavas’ assembly hall (Maya Sabhā)',
    ],
    textNote: {
      text: 'In Talātala lives Maya Dānava, protected by Tripurāri (Śiva).',
      source: 'cf. Bhāgavata Purāṇa 5.24.28',
    },
    accent: '#c0c6d6',
    tone: 0.33,
  }),

  mahatala: lower('mahatala', Y.mahatala, {
    name: 'Mahatala',
    iast: 'Mahātala',
    devanagari: 'महातल',
    epithet: 'The Realm of Many-hooded Serpents',
    tier: '5th lower world',
    deities: ['Kadru’s serpents: Kuhaka, Takṣaka, Kāliya, Suṣeṇa'],
    description: [
      'Mahātala is home to the many-hooded serpents descended from Kadru, among them Kuhaka, Takṣaka, Kāliya and Suṣeṇa.',
      'Huge and powerful as they are, these serpents live in constant fear of Garuḍa, Viṣṇu’s eagle and their ancient enemy.',
    ],
    facts: [
      'Kadru was the mother of the nāgas',
      'Garuḍa is the son of Vinatā, Kadru’s sister',
      'The serpents are always wary of Garuḍa',
    ],
    textNote: {
      text: 'In Mahātala dwell many-hooded serpents, sons of Kadru, ever fearful of Garuḍa.',
      source: 'cf. Bhāgavata Purāṇa 5.24.29',
    },
    accent: '#6fe39a',
    tone: 0.3,
  }),

  rasatala: lower('rasatala', Y.rasatala, {
    name: 'Rasatala',
    iast: 'Rasātala',
    devanagari: 'रसातल',
    epithet: 'The Stronghold of the Daityas',
    tier: '6th lower world',
    deities: ['Daityas & Dānavas: Paṇis, Nivātakavacas, Kāleyas'],
    description: [
      'Rasātala is the stronghold of the Daityas and Dānavas, sons of Diti and Danu. Among them are the Paṇis, the Nivātakavacas and the Kāleyas, ancient enemies of the devas.',
      'They are mighty, yet they live hidden like snakes in fear of Viṣṇu’s Sudarśana cakra.',
    ],
    facts: [
      'Its residents are sons of Diti and Danu',
      'They are rivals of Indra and the devas',
      'They fear the Sudarśana cakra',
    ],
    textNote: {
      text: 'In Rasātala live the Daityas and Dānavas, who hide in fear of the Lord’s cakra.',
      source: 'cf. Bhāgavata Purāṇa 5.24.30',
    },
    accent: '#ff6b5a',
    tone: 0.26,
  }),

  patala: {
    ...lower('patala', Y.patala, {
      name: 'Patala',
      iast: 'Pātāla · Nāgaloka',
      devanagari: 'पाताल',
      epithet: 'The Realm of the Nāgas',
      tier: '7th lower world, the deepest',
      deities: ['Vāsuki & the Nāgas', 'Ananta Śeṣa below'],
      description: [
        'Pātāla, the deepest of the seven lower worlds, is Nāgaloka, ruled by Vāsuki, king of the serpents. Great nāgas such as Śaṅkha, Kulika, Mahāśaṅkha, Śveta and Dhanañjaya live in its palaces, and the jewels on their hoods light the darkness so that no sun is needed.',
        'Beneath Pātāla lies Ananta Śeṣa (Saṅkarṣaṇa), the serpent of a thousand hoods. He holds the entire universe on one hood as if it were a mustard seed.',
      ],
      facts: [
        'Nārada called Pātāla more beautiful than Svarga (Viṣṇu Purāṇa 2.5)',
        'Vāsuki served as the churning rope in the Samudra Manthan',
        'The jewels on the serpents’ hoods are its only light',
        'Ananta’s hoods hold up all the worlds',
      ],
      textNote: {
        text: 'The jewels on the hoods of the great serpents dispel all darkness in Pātāla. Below it, Ananta holds the universe on one hood like a mustard seed.',
        source: 'cf. Bhāgavata Purāṇa 5.24.31; 5.25.2',
      },
      accent: '#3ee0d0',
      tone: 0.22,
      labelRange: 3800,
    }),
    view: [0, 30, 104],
    orbit: { min: 10, max: 280, minPolar: 0.95, maxPolar: 2.3 },
  },

  yama: {
    id: 'yama',
    name: 'Yamaloka',
    iast: 'Yamaloka · Saṁyamanī',
    devanagari: 'यमलोक',
    epithet: 'The Court of Yama and the Narakas',
    group: 'lower',
    tier: 'South, above the Garbhodaka ocean',
    deities: ['Yama (Dharmarāja)', 'Citragupta', 'The Yamadūtas'],
    description: [
      'Yama, lord of death and justice, rules from the city of Saṁyamanī as Dharmarāja. Citragupta keeps a record of every soul’s deeds, and Yama judges each soul by its karma. To reach the city, souls must cross the Vaitaraṇī river.',
      'The Narakas are places of purification, not eternal damnation; once their karma is used up, souls go on to rebirth. Yama is also a teacher: in the Kaṭha Upaniṣad he explains the immortal self to the boy Naciketas.',
    ],
    facts: [
      'Yama rides a water buffalo and carries a noose (pāśa)',
      'The Bhāgavata (5.26) lists 28 principal Narakas',
      'Tradition says the gift of a cow (go-dāna) helps a soul cross the Vaitaraṇī',
      'Yama was the first mortal to die and find the path to the next world (Ṛgveda 10.14)',
    ],
    verse: {
      devanagari:
        'श्रेयश्च प्रेयश्च मनुष्यमेतस्\nतौ सम्परीत्य विविनक्ति धीरः ।\nश्रेयो हि धीरोऽभि प्रेयसो वृणीते\nप्रेयो मन्दो योगक्षेमाद्वृणीते ॥',
      iast: 'śreyaś ca preyaś ca manuṣyam etas\ntau samparītya vivinakti dhīraḥ\nśreyo hi dhīro ’bhi preyaso vṛṇīte\npreyo mando yoga-kṣemād vṛṇīte',
      translation:
        'Both the good and the pleasant come to a person. The wise examine the two and tell them apart. The wise choose the good over the pleasant; the fool chooses the pleasant for the sake of gain and comfort.',
      source: 'Kaṭha Upaniṣad 1.2.2 (Yama to Naciketas)',
    },
    accent: '#ff5a3c',
    focus: [0, Y.yama + 4, 190],
    view: [0, 44, 92],
    orbit: { min: 8, max: 320, minPolar: 0.4, maxPolar: 1.55 },
    label: { at: [0, Y.yama + 34, 190], range: 4200 },
    tone: 0.15,
  },
}

/** Top-to-bottom order used by the navigator and ascend / descend. */
export const ORDER: RealmId[] = [
  'vaikuntha',
  'satya',
  'tapa',
  'jana',
  'mahar',
  'svarga',
  'bhuvar',
  'bhu',
  'kailash',
  'kshira',
  'atala',
  'vitala',
  'sutala',
  'talatala',
  'mahatala',
  'rasatala',
  'patala',
  'yama',
]

export const GROUPS: { id: RealmGroup; title: string; subtitle: string }[] = [
  { id: 'beyond', title: 'Beyond the Egg', subtitle: 'Nitya-dhāma' },
  { id: 'upper', title: 'Upper Worlds', subtitle: 'Ūrdhva-loka' },
  { id: 'earth', title: 'Earth', subtitle: 'Bhū-maṇḍala' },
  { id: 'lower', title: 'Lower Worlds', subtitle: 'Adho-loka · Pātāla' },
]

/** The guided “yātrā”: ascend from Earth, then descend to the depths. */
export const TOUR: RealmId[] = [
  'brahmanda',
  'bhu',
  'kailash',
  'kshira',
  'bhuvar',
  'svarga',
  'mahar',
  'jana',
  'tapa',
  'satya',
  'vaikuntha',
  'sutala',
  'patala',
  'yama',
  'brahmanda',
]
