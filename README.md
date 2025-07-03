# PseudoCode to MIT App Inventor 2 Converter

A web application that converts pseudo code into MIT App Inventor 2 AIA (App Inventor Archive) files. The application allows educators and developers to write simple pseudocode describing mobile app behavior and automatically generate MIT App Inventor 2 project files that can be imported directly into the MIT App Inventor development environment.

## Features

- **Monaco Code Editor**: Syntax highlighting for pseudo code with real-time validation
- **Real-time Parsing**: Immediate feedback on syntax errors as you type
- **AIA File Generation**: Creates downloadable MIT App Inventor 2 compatible files
- **Component Support**: Handles Buttons, Labels, Screens, and basic properties
- **Event Handling**: Supports Click events and property setting actions
- **Responsive UI**: Clean, modern interface built with React and Tailwind CSS

## Supported Pseudo Code Syntax

### Event Handlers
```
When ComponentName.EventName
```

### Property Setting
```
Set ComponentName.Property to Value
```

### Comments
```
// This is a comment
```

### Complete Example
```
// When Button1 is clicked
When Button1.Click
    Set Screen1.BackgroundColor to Red

// When Button2 is clicked
When Button2.Click
    Set Screen1.BackgroundColor to Green
    Set Label1.Text to "Hello World"
```

## Supported Components

- **Screen**: Main app screen (Screen1, Screen2, etc.)
- **Button**: Interactive buttons (Button1, Button2, etc.)
- **Label**: Text display labels (Label1, Label2, etc.)
- **TextBox**: Text input fields (TextBox1, TextBox2, etc.)
- **Image**: Image components (Image1, Image2, etc.)

## Supported Properties

- **BackgroundColor**: Red, Green, Blue, Yellow, White, Black, Gray, Orange, Purple, Pink
- **TextColor**: Same color options as BackgroundColor
- **Text**: Any text string (use quotes for strings with spaces)

## Installation and Setup

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager

### Installation Steps

1. **Extract the ZIP file** to your desired directory

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:5000`

## Usage Instructions

1. **Enter Pseudo Code**: Type your pseudo code in the left panel using the supported syntax
2. **Real-time Validation**: Watch as the code is parsed and validated in real-time
3. **View Output**: See the parsed structure and detected components in the right panel
4. **Download AIA**: Click "Download AIA" to generate and download the MIT App Inventor 2 file
5. **Import to MIT App Inventor**: Upload the downloaded .aia file to MIT App Inventor 2

## Testing with MIT App Inventor 2

1. Go to [MIT App Inventor 2](http://ai2.appinventor.mit.edu/)
2. Create a new project or open an existing one
3. Click "Projects" → "Import project (.aia) from my computer"
4. Select the downloaded .aia file from this application
5. The components and blocks will be automatically imported

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── lib/           # Core logic (parser, AIA generator)
│   │   ├── pages/         # Application pages
│   │   └── hooks/         # React hooks
├── server/                # Backend Express server
├── shared/                # Shared TypeScript schemas
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Architecture

- **Frontend**: React with TypeScript, Tailwind CSS, Monaco Editor
- **Backend**: Express.js with TypeScript
- **Parsing**: Custom pseudo code parser with error reporting
- **File Generation**: JSZip for creating AIA files
- **UI Components**: Radix UI via shadcn/ui for consistent design

## Troubleshooting

### Common Issues

1. **Monaco Editor not loading**: Ensure you have a stable internet connection for CDN resources
2. **AIA file not downloading**: Check browser permissions for file downloads
3. **Parsing errors**: Ensure your pseudo code follows the exact syntax shown in examples

### Error Messages

- "Action found without preceding event handler": Make sure every `Set` statement is inside a `When` block
- "Invalid syntax": Check that component names start with capital letters and follow naming conventions

## Contributing

This is an educational tool designed for learning MIT App Inventor 2 concepts through pseudo code. The application focuses on basic components and events to help beginners understand app development concepts.

## License

MIT License - Feel free to use and modify for educational purposes.