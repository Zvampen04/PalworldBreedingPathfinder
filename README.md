# Palworld Breeding Calculator

A comprehensive desktop application for Palworld that helps players find breeding combinations, calculate shortest breeding paths, and manage their breeding progress. Built with Tauri, React, and TypeScript for optimal performance and cross-platform compatibility.

## 🎯 Features

### 🔍 Breeding Lookup
- **Parent Lookup**: Find what child results from breeding two specific Pals
- **Child Lookup**: Find all possible parent combinations for a desired child
- **Path Finding**: Calculate the shortest breeding path from any Pal to your target

### 📊 Progress Tracking
- **Real-time Progress**: Watch breeding calculations in real-time with progress bars
- **Favorites System**: Save and organize your favorite breeding paths
- **Ongoing Tracking**: Track your current breeding progress with step-by-step guidance
- **Collections**: Group related breeding paths into custom collections

### 🛠️ Data Management
- **Automatic Updates**: Built-in scrapers to keep breeding data current
- **Image Scraping**: Automatically download and update Pal images
- **Breeding Data**: Keep breeding combinations up-to-date with the latest game data
- **Full Calculator**: Comprehensive breeding path calculations

### 🎨 User Experience
- **Dark/Light Mode**: Toggle between themes for comfortable viewing
- **Responsive Design**: Works seamlessly on different screen sizes
- **Elemental Weaknesses**: Built-in reference chart for type effectiveness
- **Keyboard Navigation**: Full keyboard support for accessibility

## 🚀 Installation

### Prerequisites

- **Node.js** (v18 or higher)
- **Rust** (latest stable version)
- **Git**

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/palworld-breeding-calculator.git
cd palworld-breeding-calculator
```

### Step 2: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Rust dependencies (this will happen automatically when building)
```

### Step 3: Build and Run

#### Development Mode
```bash
# Start the development server
npm run tauri dev
```

#### Production Build
```bash
# Build for production
npm run tauri build
```

The built application will be available in `src-tauri/target/release/`.

### Step 4: First Run Setup

On first run, the application will need to download and process breeding data:

1. **Update All Data**: Click the "Update All Data" button in Settings to download the latest breeding combinations and images
2. **Wait for Completion**: The process will show real-time progress for each component:
   - Image scraping (downloads Pal images)
   - Breeding data scraping (updates breeding combinations)
   - Full calculator setup (prepares pathfinding algorithms)

## 🏗️ Project Structure

```
palworld-calculator/
├── src/                          # React frontend
│   ├── components/               # React components
│   │   ├── context/             # React context providers
│   │   ├── layout/              # Layout components (Sidebar, etc.)
│   │   ├── pages/               # Page components
│   │   └── ui/                  # Reusable UI components
│   ├── utils/                   # Utility functions
│   └── App.tsx                  # Main application component
├── src-tauri/                   # Tauri backend
│   ├── src/                     # Rust source code
│   ├── binaries/                # Sidecar executables
│   ├── capabilities/            # Tauri permissions
│   └── tauri.conf.json          # Tauri configuration
├── public/                      # Static assets
│   └── Assets/                  # Images and other assets
└── package.json                 # Node.js dependencies
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run tauri dev          # Start development server
npm run dev                # Start Vite dev server only

# Building
npm run tauri build        # Build for production
npm run build              # Build frontend only

# Utilities
npm run lint               # Run ESLint
npm run type-check         # Run TypeScript type checking
```

### Sidecar Binaries

The application uses several Python sidecar binaries for data processing:

- **breeding-path**: Calculates shortest breeding paths
- **breeding-scraper**: Scrapes breeding combinations from the web
- **image-scraper**: Downloads and processes Pal images
- **fullcalc-scraper**: Comprehensive breeding calculations

These are automatically built and bundled with the application.

## 🎮 Usage

### Basic Breeding Lookup

1. **Select Mode**: Choose between "Parent Lookup", "Child Lookup", or "Path Finding"
2. **Enter Pals**: Input the names of the Pals you want to breed
3. **Get Results**: View the breeding combination or path

### Path Finding

1. **Set Parameters**: Choose your starting Pal and target child
2. **Configure Options**: Set computation time and max paths
3. **Calculate**: Watch real-time progress as the algorithm finds the shortest path
4. **Save**: Star paths to save them to your favorites

### Managing Favorites

- **Save Paths**: Click the star icon on any path to save it
- **Organize**: Create collections to group related paths
- **Track Progress**: Mark steps as completed to track your breeding progress

## 🔒 Permissions

The application requires the following permissions:

- **File System Access**: To read/write breeding data and images
- **Network Access**: To scrape updated breeding data from the web
- **Shell Access**: To execute sidecar binaries for calculations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Palworld Community**: For breeding data and combinations
- **Tauri Team**: For the excellent desktop app framework
- **React Team**: For the powerful frontend framework

## 🐛 Troubleshooting

### Common Issues

**"Failed to spawn sidecar" Error**
- Ensure all Python dependencies are installed
- Check that the binaries are properly built
- Verify file permissions

**"Breeding data not found" Error**
- Run "Update All Data" from the Settings page
- Check your internet connection
- Verify the data files are in the correct location

**Build Errors**
- Ensure you have the latest Rust toolchain: `rustup update`
- Clear build cache: `npm run clean && cargo clean`
- Check that all dependencies are properly installed

### Getting Help

If you encounter issues:

1. Check the [Issues](https://github.com/yourusername/palworld-breeding-calculator/issues) page
2. Search existing discussions
3. Create a new issue with detailed information about your problem

## 📊 System Requirements

- **OS**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB free space
- **Network**: Internet connection for data updates

---

**Happy Breeding! 🐾**
