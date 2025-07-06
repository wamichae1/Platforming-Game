# Portal Platformer

A fun 2D platformer game built with p5.js and p5.play featuring portals, enemies, collectibles, and multiple levels!

## 🎮 Game Features

### Core Mechanics
- **Portal System**: Teleport between different locations using colorful portals
- **Platform Physics**: Realistic jumping and movement mechanics
- **Enemy AI**: Different enemy types with unique behaviors
- **Collectibles**: Coins and gems to increase your score
- **Level Progression**: Multiple levels with increasing difficulty
- **Lives System**: 3 lives with respawn mechanics

### Game Elements
- **Player**: Blue character with smooth movement controls
- **Platforms**: Brown platforms to jump on
- **Enemies**: 
  - Red patrol enemies that move back and forth
  - Jumping enemies that bounce up and down
- **Collectibles**:
  - Gold coins ($) worth 50 points
  - Purple gems (★) worth 200 points
- **Portals**: Animated portals that teleport you instantly
- **Goal**: Golden flag to complete each level

## 🎯 How to Play

### Controls
- **Arrow Keys** or **WASD**: Move left/right
- **Up Arrow**, **W**, or **Spacebar**: Jump
- **Mouse**: Click buttons for game over/level complete screens

### Objectives
1. Navigate through each level using platforms and portals
2. Collect coins and gems to increase your score
3. Avoid or defeat enemies by jumping on them
4. Reach the golden flag to complete the level
5. Complete all levels to win the game!

### Scoring
- **Coin**: 50 points
- **Gem**: 200 points
- **Defeating Enemy**: 100 points

## 🚀 How to Run

1. **Download/Clone** this repository
2. **Open** `index.html` in a modern web browser
3. **Start Playing** immediately!

### Requirements
- Modern web browser with JavaScript enabled
- No additional installations needed
- Works offline

## 🛠️ Technical Details

### Built With
- **p5.js**: Main graphics and animation library
- **p5.play**: Game physics and collision detection
- **HTML5/CSS3**: Structure and styling
- **Vanilla JavaScript**: Game logic and mechanics

### Game Architecture
- **Object-Oriented Design**: Separate classes for Player, Enemy, Portal, etc.
- **Level System**: Configurable level data structure
- **State Management**: Game states for playing, game over, level complete
- **Responsive Design**: Works on different screen sizes

## 🎨 Customization

### Adding New Levels
Edit the `levels` array in `game.js` to add new levels:

```javascript
{
    platforms: [
        {x: 0, y: 550, w: 200, h: 50},
        // Add more platforms...
    ],
    enemies: [
        {x: 350, y: 420, type: 'patrol', patrolStart: 300, patrolEnd: 450},
        // Add more enemies...
    ],
    collectibles: [
        {x: 350, y: 400, type: 'coin'},
        // Add more collectibles...
    ],
    portals: [
        {x: 750, y: 200, targetX: 50, targetY: 500, color: [255, 0, 255]},
        // Add more portals...
    ],
    goal: {x: 700, y: 100, w: 50, h: 50}
}
```

### Modifying Game Mechanics
- **Player Speed**: Change `this.speed` in Player class
- **Jump Power**: Modify `this.jumpPower` in Player class
- **Gravity**: Adjust gravity value in Player's update method
- **Enemy Behavior**: Modify Enemy class update methods

## 🎮 Future Enhancements

Potential features to add:
- **Power-ups**: Speed boost, double jump, shield
- **More Enemy Types**: Flying enemies, shooting enemies
- **Moving Platforms**: Platforms that move horizontally or vertically
- **Checkpoints**: Save progress within levels
- **Sound Effects**: Audio feedback for actions
- **Particle Effects**: Visual effects for portals and collectibles
- **Level Editor**: Create custom levels
- **Multiplayer**: Local co-op mode

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to fork this project and add your own features! Some ideas:
- New enemy types
- Additional collectibles
- More portal mechanics
- Level designs
- Visual improvements

---

**Have fun playing Portal Platformer!** 🎮✨ 