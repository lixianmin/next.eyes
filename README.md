# Next.js Interactive Eyes

An engaging and interactive eye animation component that responds to device movements and orientation. Built with Next.js and Tailwind CSS, it creates a playful and responsive user experience.

## Overview

The application displays a pair of animated eyes that:
- Follow device movement and orientation
- React to device shaking with dizzy animations
- Show different moods when static
- Provide smooth transitions between states

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/next.eyes.git
cd next.eyes
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open the application:
- On desktop: Visit `http://localhost:3000`
- On mobile: Connect to your local network and visit your computer's IP address
- Grant motion and orientation permissions when prompted

## State Machine Implementation

### Interactive States
The eyes component implements a finite state machine with three distinct states:

1. **Static State** (`static`)
   - Activated when device is stationary (e.g., placed on desktop)
   - Displays random mood animations (happy, sleepy, surprised, angry)
   - Eyes move in gentle patterns
   - Mood changes every 0.5-1 second

2. **Looking State** (`looking`)
   - Activated when device is held and moved slowly
   - Eyes follow device movement
   - Uses device orientation for precise tracking
   - Normal expression with realistic eye movement

3. **Dizzy State** (`dizzy`)
   - Triggered by rapid device shaking
   - Shows spinning animation
   - Automatically returns to looking state after 800ms
   - Includes smooth transition animations

### Mood Expressions
- **Happy**: Slightly squinted eyes with upward curve
- **Sleepy**: Nearly closed eyes with reduced opacity
- **Surprised**: Larger, rounder eyes
- **Angry**: Angled eyes with furrowed look
- **Normal**: Default eye shape

### Movement Detection
- Static detection threshold: 0.5 (acceleration units)
- Shake detection threshold: 25 (acceleration units)
- Static timeout: 1 second
- Smooth transitions between all states

## Technical Implementation

### State Machine Pattern
```typescript
type EyeState = 'static' | 'looking' | 'dizzy';
```

State transitions:
- `static` → `looking`: When movement detected
- `looking` → `dizzy`: When shake detected
- `dizzy` → `looking`: After animation completes
- `looking` → `static`: After 1 second of no movement

### Animation System
- Uses CSS keyframes for mood animations
- Spring physics for smooth eye movement
- RequestAnimationFrame for performance
- Tailwind CSS for styling

## Technical Requirements

### Device Requirements
- Accelerometer and gyroscope sensors
- Modern mobile browser
- Permission to access device motion/orientation

### Browser Support
- iOS Safari 12.2+
- Android Chrome 51+
- Other modern mobile browsers with DeviceMotion API support

## Development

### Project Structure
```
next.eyes/
├── src/
│   ├── components/
│   │   └── Eyes.tsx       # Main eye component
│   ├── pages/
│   │   └── index.tsx      # Main page
│   └── styles/
│       └── globals.css    # Global styles
├── public/
├── package.json
└── README.md
```

### Key Features
- Finite state machine for state management
- Spring physics for natural movement
- CSS animations for mood expressions
- Device motion/orientation tracking
- Responsive design

## Contributing

We welcome contributions! Please feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## License

MIT License - feel free to use this project for your own purposes.

## Acknowledgments

- Built with Next.js and Tailwind CSS
- Inspired by interactive UI/UX designs
- Thanks to all contributors
