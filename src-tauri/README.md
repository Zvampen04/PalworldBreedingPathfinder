# Palworld Breeding Calculator Scraper

A comprehensive web scraper for the Game8 Palworld breeding calculator that extracts all breeding combinations and saves them to a CSV file.

## Features

- Scrapes the complete Palworld breeding calculator from Game8
- Handles dynamic React-based dropdown interactions
- Extracts all parent combinations for every Pal
- Saves data in CSV format for easy analysis
- Robust error handling and logging
- Configurable headless/GUI mode

## Prerequisites

Before running the scraper, you need:

1. **Python 3.7+** installed on your system
2. **Google Chrome browser** installed

That's it! **No manual ChromeDriver setup needed** - Selenium 4+ automatically manages ChromeDriver using its built-in Selenium Manager.

## Installation

1. Clone or download this repository
2. Install the required dependencies:
```bash
pip install -r requirements.txt
```

### Alternative Installation (if you encounter issues):
If you face compilation issues on Windows, install packages individually:
```bash
pip install selenium beautifulsoup4 requests
```

## Usage

### Basic Usage
```bash
python palworld_breeding_scraper.py
```

### Headless Mode (No GUI)
To run the scraper without opening a browser window, modify the script:
```python
scraper = PalworldBreedingScraper(headless=True)
```

## Output

The scraper will create a CSV file named `palworld_breeding_combinations.csv` with the following columns:
- `child`: The resulting Pal from breeding
- `parent1`: First parent Pal
- `parent2`: Second parent Pal

### Sample Output:
```csv
child,parent1,parent2
Lamball,Mau,Vixy
Cattiva,Lamball,Chikipi
Chikipi,Lamball,Cattiva
```

## How It Works

1. **Navigation**: Opens the Game8 Palworld breeding calculator page
2. **Dropdown Discovery**: Finds the React-based dropdown input for selecting Pals
3. **Option Extraction**: Gets all available Pal options from the dropdown
4. **Data Scraping**: For each Pal:
   - Selects it from the dropdown
   - Waits for breeding combinations to load
   - Extracts parent combination data
   - Stores the results
5. **Data Export**: Saves all combinations to a CSV file

## Configuration

### Timeouts and Delays
You can adjust various timing parameters in the script:
- `timeout=10` in wait methods for slower connections
- `time.sleep()` values for page loading delays

### Selectors
The script uses multiple CSS selectors to find elements. If the website structure changes, you may need to update these selectors in:
- `find_dropdown_input()` method
- `extract_breeding_combinations()` method

## Troubleshooting

### Common Issues

1. **Chrome browser not found**
   - Make sure Google Chrome is installed and up to date
   - Selenium Manager automatically handles ChromeDriver

2. **Website changes**
   - The Game8 website may update their structure
   - Check the browser console for errors
   - Update CSS selectors if needed

3. **Rate limiting**
   - The script includes delays to be respectful
   - If you encounter issues, increase the `time.sleep()` values

4. **No data extracted**
   - Check if the website requires accepting cookies/terms
   - Verify the dropdown is accessible
   - Run in non-headless mode to see what's happening

### Debug Mode
To see what's happening, run in non-headless mode and check the console output:
```python
scraper = PalworldBreedingScraper(headless=False)
```

## Ethical Considerations

- The scraper includes respectful delays between requests
- It only accesses publicly available data
- Please respect the website's terms of service
- Consider the server load and don't run multiple instances simultaneously

## License

This project is for educational purposes. Please respect the original website's terms of service and copyright.

## Contributing

Feel free to submit issues or improvements to make the scraper more robust! 