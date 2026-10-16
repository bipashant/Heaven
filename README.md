# Brahmāṇḍa · ब्रह्माण्ड

An interactive 3D map of the Purāṇic cosmos. Pick a destination, fly there through space, and orbit it from a bird's-eye view.

This is a conceptual MVP with a realistic rendering approach. It uses physically based materials, HDR bloom, a sun that circles Meru to give day and night, and procedural terrain. Every model, texture and sound is generated in code, so the app ships no assets.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

Requires a WebGL2 browser. It runs at 60 fps on Apple-silicon Macs.

## Controls

| Action | How |
| --- | --- |
| Travel | Click a realm in the left list, or a glowing name in the scene |
| Look around | Drag (one finger on touch) |
| Zoom | Scroll or pinch: zooms toward whatever is under the pointer or between your fingers, all the way in |
| Move across the sky | Right-drag, Shift-drag or middle-drag; two-finger drag on touch |
| Fly to a spot | Double-click or double-tap anything |
| Back to the whole cosmos | Zoom far out, press Esc, or the egg / Cosmos button |
| Ascend / descend | ↑ / ↓ keys, or the buttons at the bottom |
| Cosmic overview | Esc, or the egg button |
| Guided tour | **Yātrā tour**: 15 stops from Earth up to Vaikuṇṭha and down to Yamaloka |
| Info panel | `i` |
| How to explore | **?** button — replays the first-visit guide |
| Sound | Speaker button: synthesised tanpura drone and a temple bell on arrival |

**On phones** a bottom dock holds Worlds, Up, the current world (tap for its story), Down and Cosmos. The world list and the story open as bottom sheets you can drag down to close. First-time visitors get a short guide that waits for them to actually drag and pinch, then offers places to start such as Svarga, Kailash and Kṣīra Sāgara. It's shown once (remembered in `localStorage`).

## What's in the cosmos

The layout follows the hybrid Purāṇic model, mainly the *Bhāgavata* and *Viṣṇu Purāṇa*:

- **Beyond the egg** (across the Virajā river): **Vaikuṇṭha**, with seven gates, Nārāyaṇa on Śeṣa with Lakṣmī, Garuḍa, Jaya and Vijaya, and flying vimānas.
- **Upper worlds**: **Satyaloka** (Brahmā, Sarasvatī, the haṁsa, the four Vedas), **Tapoloka**, **Janaloka** (the four Kumāras), **Maharloka** (Bhṛgu and the ṛṣis), **Svarga** (Indra's Amarāvatī with Airāvata, the Kalpavṛkṣa and Pārijāta, apsarās and Indra's rainbow) and **Bhuvarloka** (the sun's twelve-spoked chariot circling Meru, the moon, Rāhu, the 28 nakṣatras, the five planets in Bhāgavata order, Dhruva and the Saptarṣi).
- **Earth**: **Bhū-maṇḍala**, with seven dvīpas and seven oceans of salt, sugarcane juice, wine, ghee, milk, yogurt and sweet water, plus Lokāloka at the rim. **Jambūdvīpa** has golden Meru, the varṣa mountain ranges and the Gaṅgā splitting into four. **Mount Kailash** has Śiva and Pārvatī seated on its summit as high-detail sculpted figures, on a tiger skin beside the trident. Nandī waits at the foot, the Gaṅgā pours from Śiva's locks down the west face, and the lakes Mānasarovara and Rākṣastāl lie below. **Kṣīra Sāgara** is a swelling sea of milk with floating lotuses and mist. On it, a detailed Viṣṇu reclines on Śeṣa's coils under seven cobra hoods, holding the conch and a spinning Sudarśana. Lakṣmī presses his feet, four-headed Brahmā sits on the navel lotus, and Śvetadvīpa lies nearby.
- **Lower worlds**: Atala, Vitala (Hāṭakeśvara), Sutala (Bali, with Vāmana at the gate), Talātala (Tripura), Mahātala (Kadru's serpents), Rasātala (the Dānava fortress) and **Pātāla** (Vāsuki's Nāgaloka, with Ananta Śeṣa's hoods rising beneath everything).
- **Yamaloka**: Saṁyamanī, with Yama, his buffalo and Citragupta, the Vaitaraṇī river, and the Narakas shown as places of purification.
- **The Causal Ocean**: countless other Brahmāṇḍas glow far off in the background as soft egg-shaped lights (Bhāgavata 6.16.37; 10.14.11).

Each realm has English and Devanagari names, presiding deities, a short description, key facts, and a verse with its source. Verses are given in Devanagari, IAST and translation, or as a referenced paraphrase where no verse is quoted.

## Design choices

- **Deities as luminous forms.** The figures are built from primitives with a "light-body" shader (fresnel rim plus a flowing inner glow). They are meant to be reverent and suggestive, not portraits.
- **Purāṇic accuracy over modern astronomy.** The disc Earth, the stacked lokas and the planet order are shown as the texts describe them. The info panel notes where texts disagree.
- **One continuous world, freely navigable.** Every realm lives in a single scene, so travel is a real camera flight: a cubic Bézier pulls back into space, then dives in, and any input interrupts it. Between flights you can go anywhere; the current world is recognised from what you're looking at (`src/data/zones.ts`), and zooming far out drifts back to the centre of the cosmos.

## Code map

```
src/
  data/layout.ts        world coordinates: heights of each loka, Bhū-maṇḍala bands, Kailash, lakes
  data/realms.ts        all realm content (text, verses) and camera framing; ORDER and TOUR
  state/store.ts        zustand store: current realm, travel, tour, sound
  three/Experience.tsx  scene root, lights, reflections, post-processing
  three/CameraRig.tsx   flights + orbit controls + dynamic near plane
  three/core/           shared clock, noise, canvas textures, materials, GeoBag (geometry merging)
  three/parts/          deity figure builders (figureBuilder = light forms; sculpt + divinePair + divineVishnu + HighFigure = detailed Śiva, Pārvatī, Viṣṇu, Lakṣmī & Brahmā), lotus/serpent/temple/animal builders, billboards, labels
  three/realms/         one file per region (Beyond, UpperLokas, Svarga, Bhuvarloka, bhu/, LowerLokas, Yamaloka, Multiverse)
  ui/Interface.tsx      navigator, info panel, toolbar, tour/keyboard behaviour
  audio/drone.ts        Web Audio tanpura and bell
```

**Adding a realm:** add an entry to `REALMS` and `ORDER` in `data/realms.ts`, and put its height in `data/layout.ts`. Then build the scene in `three/realms/` and mount it in `Experience.tsx`. Use `<Caption when={['your-id']} />` for in-scene labels.

## Next steps

- AI-painted or sculpted deity art, as panels or GLB models, in place of the procedural forms
- Nepali/Hindi UI toggle (the content is already structured for it)
- More of the Narakas, the dvīpas' own mountains and rivers, and the coverings of the egg
- A low-power mode for phones (fewer particles, no MSAA)
