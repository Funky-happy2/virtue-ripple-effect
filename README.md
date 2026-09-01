# Virtue Ripple

Build a web application called "The Leverage of Virtue Simulation". It is an interactive ethical sandbox that visualises how a person's societal power multiplies the impact of their moral choices.

Use a clean, modern design with a dark aesthetic, using vibrant accent colours (like neon green for positive virtue ripples and crimson red for negative vice ripples) to represent ethical impact.

1. Core Layout & UI Components

Header: Title "The Leverage of Virtue Simulation" with a brief, punchy subtitle: "See how power multiplies the consequences of choice."

Left Panel (Controls):

The Power Slider: A prominent slider with 5 distinct steps:

Average Citizen (Power Level: 1)

Business Owner (Power Level: 10)

Local Mayor (Power Level: 100)

National Leader (Power Level: 10,000)

Global CEO / Tech Titan (Power Level: 1,000,000)

Action Cards (The Choice Matrix): A grid of selectable buttons split into two categories:

Virtuous Actions: "Honesty & Transparency", "Generous Resource Sharing", "Protecting the Vulnerable".

Vicious Actions: "Taking a Bribe / Corruption", "Hoarding Resources", "Spreading Misinformation".

Right Panel / Main View (The Visualizer):

An interactive canvas or visual area showing a network grid of dots representing "Society".

When a user selects an action, a wave or "ripple" radiates from the centre. The size, intensity, speed, and colour of the ripple scale based on the selected Power Slider level.

Bottom Panel (The Impact Dashboard):

Live counters that update dynamically based on the current Power + Choice combination:

Lives Affected Counter: (e.g., 2 people vs. 20,000,000 people).

Society Stability Rating: A percentage bar that goes up with virtue and crashes down with vice.

Ethical Summary Text: A short, dynamic text box explaining the outcome (e.g., "When a Global CEO spreads misinformation, trust in public systems collapses globally, impacting millions.").

2. Dynamic Logic & Equations

Impact Multiplier: Multiply the base consequence of the action by the Power Level.

Low Power Virtue: Creates a small, glowing green ring. Society stability increases by +0.1%.

High Power Virtue: Creates a massive, golden-green wave engulfing the whole screen. Society stability jumps by +25%.

Low Power Vice: Creates a tiny red spark. Society stability drops by -0.5%.

High Power Vice: Creates a violent red shockwave that fractures the visual grid. Society stability plummets by -50%.

3. Micro-Interactions & Gamification

Include a "Reset Society" button to restore variables back to baseline.

Add an "Ethical Quote of the Day" footer that updates based on the current power level (e.g., featuring quotes from Spider-Man's Uncle Ben, Aristotle, or Lord Acton).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://virtue-ripple-effect.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/50e60b60-cbce-4730-91a0-ef1ee768a47c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
