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
| Orbit / zoom / pan | Drag / scroll or pinch / right-drag |
| Ascend / descend | ↑ / ↓ keys, or the buttons at the bottom |
| Cosmic overview | Esc, or the egg button |
| Guided tour | **Yātrā tour**: 15 stops from Earth up to Vaikuṇṭha and down to Yamaloka |
| Info panel | `i` |
| Sound | Speaker button: synthesised tanpura drone and a temple bell on arrival |

## What's in the cosmos

The layout follows the hybrid Purāṇic model, mainly the *Bhāgavata* and *Viṣṇu Purāṇa*:

- **Beyond the egg** (across the Virajā river): **Vaikuṇṭha**, with seven gates, Nārāyaṇa on Śeṣa with Lakṣmī, Garuḍa, Jaya and Vijaya, and flying vimānas.
- **Upper worlds**: **Satyaloka** (Brahmā, Sarasvatī, the haṁsa, the four Vedas), **Tapoloka**, **Janaloka** (the four Kumāras), **Maharloka** (Bhṛgu and the ṛṣis), **Svarga** (Indra's Amarāvatī with Airāvata, the Kalpavṛkṣa and Pārijāta, apsarās and Indra's rainbow) and **Bhuvarloka** (the sun's twelve-spoked chariot circling Meru, the moon, Rāhu, the 28 nakṣatras, the five planets in Bhāgavata order, Dhruva and the Saptarṣi).
- **Earth**: **Bhū-maṇḍala**, with seven dvīpas and seven oceans of salt, sugarcane juice, wine, ghee, milk, yogurt and sweet water, plus Lokāloka at the rim. **Jambūdvīpa** has golden Meru, the varṣa mountain ranges and the Gaṅgā splitting into four. **Mount Kailash** has Śiva and Pārvatī on a tiger skin, Nandī, the trident, the Gaṅgā flowing from Śiva's locks, and Mānasarovara and Rākṣastāl. **Kṣīra Sāgara** has Viṣṇu reclining on Śeṣa, Lakṣmī, Brahmā on the navel lotus, and Śvetadvīpa.
- **Lower worlds**: Atala, Vitala (Hāṭakeśvara), Sutala (Bali, with Vāmana at the gate), Talātala (Tripura), Mahātala (Kadru's serpents), Rasātala (the Dānava fortress) and **Pātāla** (Vāsuki's Nāgaloka, with Ananta Śeṣa's hoods rising beneath everything).
- **Yamaloka**: Saṁyamanī, with Yama, his buffalo and Citragupta, the Vaitaraṇī river, and the Narakas shown as places of purification.

Each realm has English and Devanagari names, presiding deities, a short description, key facts, and a verse with its source. Verses are given in Devanagari, IAST and translation, or as a referenced paraphrase where no verse is quoted.

## Design choices

- **Deities as luminous forms.** The figures are built from primitives with a "light-body" shader (fresnel rim plus a flowing inner glow). They are meant to be reverent and suggestive, not portraits.
- **Purāṇic accuracy over modern astronomy.** The disc Earth, the stacked lokas and the planet order are shown as the texts describe them. The info panel notes where texts disagree.
- **One continuous world.** Every realm lives in a single scene, so travel is a real camera flight. A cubic Bézier pulls back into space, then dives in, and orbit controls with per-realm limits take over on arrival.

## Code map

```
src/
  data/layout.ts        world coordinates: heights of each loka, Bhū-maṇḍala bands, Kailash, lakes
  data/realms.ts        all realm content (text, verses) and camera framing; ORDER and TOUR
  state/store.ts        zustand store: current realm, travel, tour, sound
  three/Experience.tsx  scene root, lights, reflections, post-processing
  three/CameraRig.tsx   flights + orbit controls + dynamic near plane
  three/core/           shared clock, noise, canvas textures, materials, GeoBag (geometry merging)
  three/parts/          deity figure builder, lotus/serpent/temple/animal builders, billboards, labels
  three/realms/         one file per region (Beyond, UpperLokas, Svarga, Bhuvarloka, bhu/, LowerLokas, Yamaloka)
  ui/Interface.tsx      navigator, info panel, toolbar, tour/keyboard behaviour
  audio/drone.ts        Web Audio tanpura and bell
```

**Adding a realm:** add an entry to `REALMS` and `ORDER` in `data/realms.ts`, and put its height in `data/layout.ts`. Then build the scene in `three/realms/` and mount it in `Experience.tsx`. Use `<Caption when={['your-id']} />` for in-scene labels.

## Next steps

- AI-painted or sculpted deity art, as panels or GLB models, in place of the procedural forms
- Nepali/Hindi UI toggle (the content is already structured for it)
- More of the Narakas, the dvīpas' own mountains and rivers, and the coverings of the egg
- A low-power mode for phones (fewer particles, no MSAA)
