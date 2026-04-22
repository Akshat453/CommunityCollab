# Design System Specification: The Kinetic Hearth

## 1. Overview & Creative North Star: "The Kinetic Hearth"
This design system moves away from the sterile, "software-as-a-service" aesthetic toward a philosophy we call **The Kinetic Hearth**. It combines the warmth of physical community spaces with the high-velocity energy of modern collaboration. 

Instead of a rigid, boxed-in grid, we utilize **Intentional Asymmetry** and **Tonal Layering**. The layout should feel like a curated editorial spread—breathable, sophisticated, and human. We break the "template" look by overlapping elements (e.g., a profile image breaking the boundary of a card) and using dramatic shifts in typography scale to create an authoritative yet welcoming hierarchy.

---

## 2. Color Philosophy & Surface Architecture
Our palette transitions from a grounding Cream base to high-energy Ignited Oranges.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts. To separate a sidebar from a main feed, transition from `surface` (#fff8f3) to `surface-container-low` (#fff2e2). 

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the `surface-container` tiers to create "nested" depth.
*   **Base:** `surface` (#fff8f3)
*   **Secondary Content Area:** `surface-container-low` (#fff2e2)
*   **Interactive Cards:** `surface-container` (#ffebd1)
*   **Floating Modals/Popovers:** `surface-container-highest` (#fadfb7)

### The "Glass & Gradient" Rule
To elevate the "out-of-the-box" feel, use **Glassmorphism** for floating elements (Top Navbars, Hovering Action Buttons).
*   **Formula:** `surface-container-lowest` at 80% opacity + `backdrop-blur: 12px`.
*   **Signature Textures:** For Primary CTAs, do not use flat hex codes. Apply a subtle linear gradient from `primary` (#af3000) to `primary-container` (#ff602e) at a 135° angle to add "soul" and dimension.

---

## 3. Typography: Editorial Authority
We use **Plus Jakarta Sans** for its geometric warmth and **Inter** for precision data-labeling.

*   **Display (lg/md):** Use for Hero moments. Set with tight letter-spacing (-0.02em) to create a bold, "magazine" feel.
*   **Headline (lg/md):** The primary voice of the community. Always in `on-surface` (#271902).
*   **Title (sm/md):** Used for card headings. These provide the structural anchor for the "No-Line" layout.
*   **Body (lg/md):** Optimized for readability. Use `on-surface-variant` (#3c4948) for secondary body text to reduce visual noise.
*   **Label (sm/md):** Set in **Inter** with +0.05em letter-spacing. This distinguishes functional metadata from narrative content.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are the enemy of "Modern Warmth." We achieve depth through the **Layering Principle**.

*   **Ambient Shadows:** When a float is required (e.g., a dragged card), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(39, 25, 2, 0.06)`. The tint is derived from `on-surface`, never pure black.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline-variant` token at 15% opacity. Standard 100% opaque borders are strictly forbidden.
*   **Depth through Blur:** Use `backdrop-blur` on secondary layers to allow the warmth of the Cream background to bleed through, ensuring the UI feels like a single integrated environment rather than a stack of stickers.

---

## 5. Components & Interaction

### Buttons
*   **Primary (Action):** Gradient from `primary` to `primary-container`. High roundedness (`lg`: 1rem). 
*   **Secondary (Verified/Action):** `secondary` (#006a67) with `on-secondary` (#ffffff) text. Used for "Join" or "Verify" actions.
*   **Tertiary:** Ghost style. No background, `primary` text. Use for low-emphasis navigation.

### Cards & Lists
*   **The Divider Ban:** Never use horizontal lines to separate list items. Use `spacing-6` (1.5rem) or a subtle shift to `surface-container-low` on hover to define items.
*   **Rounding:** Apply `xl` (1.5rem) to major containers and `lg` (1rem) to inner nested cards.

### Progress & Slot Counters
*   **The "Pulse" Progress Bar:** Use `tertiary-container` (#d28151) for the track and `tertiary` (#904c21) for the fill. 
*   **Visual Prominence:** Slot counters (e.g., "5/10 spots left") should use `label-md` in a `secondary-container` chip to pop against the warm background.

### Verified Badges
*   Custom teal checkmarks using `secondary` (#006a67). Place them slightly overlapping the user avatar's bottom-right edge to reinforce the layering theme.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical margins. If a left margin is `spacing-8`, consider a right margin of `spacing-12` for editorial flair.
*   **Do** use `display-lg` typography for empty states. Make the "nothing here" feel like a design choice.
*   **Do** overlap elements. Let an image or a badge "break" the container of a card to create 3D depth.

### Don't
*   **Don't** use pure black (#000) for text. Use `on-surface` (#271902) to maintain the "Hearth" warmth.
*   **Don't** use 1px dividers. If you feel you need a line, use a 4px vertical color block of `secondary` instead to indicate focus.
*   **Don't** use standard "Drop Shadows." If it looks like a default Photoshop shadow, it's too heavy. Increase blur and decrease opacity.