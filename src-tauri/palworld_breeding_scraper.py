import time
import csv
import requests
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException, ElementClickInterceptedException
from selenium.webdriver.common.keys import Keys
from bs4 import BeautifulSoup
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PalworldBreedingScraper:
    def __init__(self, headless=False):
        """Initialize the scraper with Chrome driver"""
        self.url = "https://game8.co/games/Palworld/archives/440530"
        self.driver = None
        self.breeding_data = []
        self.setup_driver(headless)
    
    def setup_driver(self, headless):
        """Setup Chrome driver with appropriate options"""
        chrome_options = Options()
        if headless:
            chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        
        try:
            # Use Selenium 4's built-in Selenium Manager (automatically handles ChromeDriver)
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            logger.info("Chrome driver initialized successfully using Selenium Manager")
            
        except Exception as e:
            logger.error(f"Failed to initialize Chrome driver: {e}")
            logger.error("Make sure Google Chrome browser is installed")
            logger.error("Selenium 4+ automatically manages ChromeDriver - no manual setup needed")
            raise
    
    def dismiss_cookie_popups(self):
        """Comprehensive cookie banner and popup dismissal"""
        if not self.driver:
            logger.error("Driver not initialized")
            return
            
        logger.info("Checking for cookie banners and popups...")
        
        # Wait for page to stabilize and popups to appear
        try:
            WebDriverWait(self.driver, 3).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
        except TimeoutException:
            pass
        
        # Common cookie banner selectors - PRIORITIZE ACCEPT BUTTONS
        cookie_selectors = [
            # Game8 specific consent popup - ACCEPT to avoid redirect
            "button:contains('Consent')",  # This should be the ACCEPT consent button
            
            # High priority ACCEPT buttons 
            "button:contains('Accept')",
            "button:contains('Accept All')",
            "button:contains('Accept all')",
            "button:contains('Allow All')",
            "button:contains('Allow all')",
            "button:contains('Agree')",
            "button:contains('Continue')",
            "button:contains('I agree')",
            "button:contains('Yes')",
            
            # CSS selectors for ACCEPT buttons
            "[data-testid*='accept']",
            "[data-cy*='accept']",
            "[aria-label*='Accept']",
            "[aria-label*='accept']",
            "[data-testid*='consent'][data-testid*='accept']",
            
            # Class-based ACCEPT selectors
            ".cookie-accept",
            ".accept-cookies",
            ".cookie-consent-accept", 
            ".gdpr-accept",
            ".privacy-accept",
            ".consent-accept",
            ".btn-accept",
            ".accept-btn",
            
            # ID-based ACCEPT selectors
            "#accept-cookies",
            "#cookie-accept", 
            "#gdpr-accept",
            "#consent-accept",
            "#accept-all",
            
            # Generic terms that indicate acceptance
            "button:contains('OK')",
            "button:contains('Got it')",
            
            # AVOID close/dismiss buttons - only use as last resort
            # "button[aria-label='Close']",
            # ".close-button",
            # ".popup-close",
        ]
        
        # Try JavaScript-based approach first (most reliable)
        js_scripts = [
            # Specific Game8 consent popup - ACCEPT consent to avoid redirect
            """
            var buttons = document.querySelectorAll('button, a, div[role="button"]');
            for (var i = 0; i < buttons.length; i++) {
                var text = buttons[i].textContent.toLowerCase().trim();
                // Handle Game8 specific consent popup - ACCEPT to continue
                if (text === 'consent' && text !== 'do not consent') {
                    if (buttons[i].offsetParent !== null) {  // Check if visible
                        buttons[i].click();
                        console.log('Clicked CONSENT button');
                        return true;
                    }
                }
            }
            return false;
            """,
            # Look for ACCEPT buttons specifically (not dismiss/close)
            """
            var buttons = document.querySelectorAll('button, a, div[role="button"]');
            for (var i = 0; i < buttons.length; i++) {
                var text = buttons[i].textContent.toLowerCase().trim();
                // Prioritize ACCEPT buttons to avoid redirects
                if (text === 'accept' || text === 'accept all' || text === 'allow all' || 
                    text === 'agree' || text === 'allow' || text === 'continue') {
                    if (buttons[i].offsetParent !== null) {  // Check if visible
                        buttons[i].click();
                        console.log('Clicked ACCEPT button: ' + text);
                        return true;
                    }
                }
            }
            return false;
            """,
            # Secondary check for other acceptance patterns
            """
            var buttons = document.querySelectorAll('button, a, div[role="button"]');
            for (var i = 0; i < buttons.length; i++) {
                var text = buttons[i].textContent.toLowerCase();
                if (text.includes('accept') || text.includes('agree') || text.includes('allow')) {
                    if (buttons[i].offsetParent !== null) {  // Check if visible
                        buttons[i].click();
                        console.log('Clicked acceptance button');
                        return true;
                    }
                }
            }
            return false;
            """,
            # Remove overlay elements that might be blocking interaction
            """
            var overlays = document.querySelectorAll('[class*="overlay"], [class*="modal"], [class*="popup"], [class*="banner"]');
            for (var i = 0; i < overlays.length; i++) {
                if (overlays[i].style.position === 'fixed' || overlays[i].style.position === 'absolute') {
                    overlays[i].style.display = 'none';
                }
            }
            """,
            # Click on body to dismiss any click-to-dismiss overlays
            "document.body.click();"
        ]
        
        # Execute JavaScript approaches
        for script in js_scripts:
            try:
                result = self.driver.execute_script(script)
                if result:
                    logger.info("Cookie banner dismissed using JavaScript")
                    time.sleep(2)
                    break
            except Exception as e:
                continue
        
        # Selenium-based approach as fallback
        for selector in cookie_selectors:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                for element in elements:
                    if element.is_displayed() and element.is_enabled():
                        button_text = element.get_attribute('textContent') or element.text or ''
                        try:
                            # Try regular click first
                            element.click()
                            logger.info(f"ACCEPTED popup using selector '{selector}' with text: '{button_text.strip()}'")
                            time.sleep(2)
                            return
                        except:
                            # Try JavaScript click as fallback
                            self.driver.execute_script("arguments[0].click();", element)
                            logger.info(f"ACCEPTED popup using JS click '{selector}' with text: '{button_text.strip()}'")
                            time.sleep(2)
                            return
            except Exception as e:
                continue
        
        # Try pressing Escape key to dismiss popups
        try:
            from selenium.webdriver.common.keys import Keys
            self.driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ESCAPE)
            time.sleep(1)
        except:
            pass
            
        logger.info("Cookie popup dismissal attempts completed")

    def wait_for_element(self, locator, timeout=3):
        """Wait for element to be present and return it"""
        if not self.driver:
            return None
        try:
            element = WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located(locator)
            )
            return element
        except TimeoutException:
            logger.warning(f"Element not found: {locator}")
            return None
    
    def wait_for_clickable(self, locator, timeout=3):
        """Wait for element to be clickable and return it"""
        if not self.driver:
            return None
        try:
            element = WebDriverWait(self.driver, timeout).until(
                EC.element_to_be_clickable(locator)
            )
            return element
        except TimeoutException:
            logger.warning(f"Element not clickable: {locator}")
            return None
    
    def wait_for_elements(self, locator, timeout=3, min_elements=1):
        """Wait for multiple elements to be present"""
        if not self.driver:
            return []
        try:
            WebDriverWait(self.driver, timeout).until(
                lambda driver: len(driver.find_elements(*locator)) >= min_elements
            )
            return self.driver.find_elements(*locator)
        except TimeoutException:
            return []
    
    def wait_for_dropdown_options(self, timeout=3):
        """Wait for dropdown options to appear"""
        if not self.driver:
            return False
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div[role='option'], [class*='option']"))
            )
            return True
        except TimeoutException:
            return False
    
    def navigate_to_page(self):
        """Navigate to the breeding calculator page"""
        if not self.driver:
            logger.error("Driver not initialized")
            return
            
        logger.info(f"Navigating to {self.url}")
        self.driver.get(self.url)
        
        # Wait for page to load completely
        self.wait_for_element((By.TAG_NAME, "body"), timeout=3)
        
        # Wait for React to render by checking for interactive elements
        try:
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input, button, [role='button']"))
            )
        except TimeoutException:
            logger.warning("Page elements not fully loaded, continuing anyway")
        
        # Handle cookie banners and popups (multiple rounds for Game8)
        self.dismiss_cookie_popups()
        # Brief wait for potential second popup, then handle it
        try:
            WebDriverWait(self.driver, 3).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "button, [role='button']"))
            )
            self.dismiss_cookie_popups()  # Handle Game8 consent popup
        except TimeoutException:
            pass  # No second popup appeared
            
        # Scroll to the breeding calculator section
        try:
            # Look for the breeding calculator heading or container
            calculator_selectors = [
                "h2:contains('Breeding Calculator')",
                "h3:contains('Breeding Calculator')", 
                "[class*='breeding']",
                "[class*='calculator']"
            ]
            
            for selector in calculator_selectors:
                try:
                    element = self.driver.find_element(By.CSS_SELECTOR, selector)
                    self.driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", element)
                    time.sleep(2)
                    break
                except:
                    continue
        except Exception as e:
            logger.info("Could not scroll to calculator section")
    
    def find_dropdown_input(self):
        """Find the breeding calculator dropdown input"""
        logger.info("Looking for breeding calculator dropdown...")
        
        # Multiple selectors to try for the React Select input
        selectors = [
            "div[class*='css-19bb58m'] input",
            "input[id*='react-select']",
            "div[class*='react-select'] input",
            "input[aria-autocomplete='list']",
            "input[role='combobox']"
        ]
        
        for selector in selectors:
            try:
                input_element = self.wait_for_element((By.CSS_SELECTOR, selector), timeout=3)
                if input_element:
                    logger.info(f"Found dropdown input with selector: {selector}")
                    return input_element
            except Exception as e:
                continue
        
        logger.error("Could not find dropdown input element")
        return None
    
    def get_dropdown_options(self, input_element):
        """Get all available options from the dropdown"""
        if not self.driver:
            logger.error("Driver not initialized")
            return []
            
        logger.info("Getting dropdown options...")
        
        # Ensure any remaining popups are dismissed
        self.dismiss_cookie_popups()
        
        try:
            # Scroll element into view
            self.driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", input_element)
            
            # Wait for element to be in view and clickable
            self.wait_for_clickable((By.CSS_SELECTOR, f"input[role='combobox']"), timeout=3)
            
            # Try multiple methods to open dropdown
            methods = [
                lambda: input_element.click(),
                lambda: self.driver.execute_script("arguments[0].click();", input_element) if self.driver else None,
                lambda: self.driver.execute_script("arguments[0].focus(); arguments[0].click();", input_element) if self.driver else None,
            ]
            
            for method in methods:
                try:
                    method()
                    # Wait for dropdown options to appear dynamically
                    if self.wait_for_dropdown_options(timeout=3):
                        break
                except Exception as e:
                    continue
            
            # Look for the options container
            options_selectors = [
                "div[class*='react-select__menu']",
                "div[class*='css-'] div[role='option']",
                "div[id*='react-select'] div[role='option']",
                "[class*='option']"
            ]
            
            options = []
            for selector in options_selectors:
                try:
                    option_elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if option_elements:
                        for option in option_elements:
                            text = option.get_attribute('textContent').strip()
                            if text and text not in options:
                                options.append(text)
                        break
                except Exception as e:
                    continue
            
            if not options:
                # Try typing to see available options
                input_element.clear()
                input_element.send_keys("a")
                # Wait for options to appear after typing
                self.wait_for_dropdown_options(timeout=3)
                
                # Try again to find options
                for selector in options_selectors:
                    try:
                        option_elements = self.driver.find_elements(By.CSS_SELECTOR, selector) if self.driver else []
                        if option_elements:
                            for option in option_elements:
                                text_content = option.get_attribute('textContent')
                                if text_content:
                                    text = text_content.strip()
                                    if text and text not in options:
                                        options.append(text)
                            break
                    except Exception as e:
                        continue
            
            logger.info(f"Found {len(options)} options in dropdown")
            return options
            
        except Exception as e:
            logger.error(f"Error getting dropdown options: {e}")
            return []
    
    def select_option(self, input_element, option_text):
        """Select a specific option from the dropdown"""
        try:
            # Clear and type the option
            input_element.clear()
            input_element.send_keys(option_text)
            
            # Wait for matching option to appear
            self.wait_for_dropdown_options(timeout=3)
            
            # Try to find and click the matching option
            option_selectors = [
                f"div[role='option']:contains('{option_text}')",
                f"[class*='option']:contains('{option_text}')",
                f"div:contains('{option_text}')"
            ]
            
            for selector in option_selectors:
                try:
                    # Use JavaScript to find and click the option
                    script = f"""
                    var elements = document.querySelectorAll('div[role="option"]');
                    for (var i = 0; i < elements.length; i++) {{
                        if (elements[i].textContent.includes('{option_text}')) {{
                            elements[i].click();
                            return true;
                        }}
                    }}
                    return false;
                    """
                    if self.driver:
                        result = self.driver.execute_script(script)
                        if result:
                            # Wait for selection to take effect
                            try:
                                WebDriverWait(self.driver, 3).until(
                                    lambda driver: len(driver.find_elements(By.CSS_SELECTOR, "[class*='parent'], [class*='breeding']")) > 0
                                )
                            except TimeoutException:
                                pass  # Continue even if no breeding results shown
                            return True
                except Exception as e:
                    continue
            
            # If clicking didn't work, try pressing Enter
            input_element.send_keys(Keys.ENTER)
            # Wait for Enter to take effect
            try:
                WebDriverWait(self.driver, 2).until(
                    lambda driver: len(driver.find_elements(By.CSS_SELECTOR, "[class*='parent'], [class*='breeding']")) > 0
                ) if self.driver else None
            except TimeoutException:
                pass
            return True
            
        except Exception as e:
            logger.error(f"Error selecting option '{option_text}': {e}")
            return False
    
    def extract_breeding_combinations(self, child_name):
        """Extract breeding combinations for the selected child"""
        logger.info(f"Extracting breeding combinations for {child_name}")
        
        # Wait for breeding content to load dynamically
        try:
            WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[class*='parent'], [class*='breeding'], [class*='combo']"))
            ) if self.driver else None
        except TimeoutException:
            logger.warning(f"No breeding content loaded for {child_name}")
            pass  # Continue even if no breeding content
        
        combinations = []
        
        try:
            # Look for parent combination containers
            parent_selectors = [
                "div[class*='style-module__parent']",
                "div[class*='parent']",
                ".parent-container",
                "[class*='breeding-parent']"
            ]
            
            for selector in parent_selectors:
                try:
                    parent_elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if parent_elements:
                        logger.info(f"Found {len(parent_elements)} parent elements")
                        
                        # Group parents in pairs (assuming they come in pairs for breeding)
                        for i in range(0, len(parent_elements), 2):
                            if i + 1 < len(parent_elements):
                                parent1_element = parent_elements[i]
                                parent2_element = parent_elements[i + 1]
                                
                                # Extract parent names
                                parent1_name = self.extract_parent_name(parent1_element)
                                parent2_name = self.extract_parent_name(parent2_element)
                                
                                if parent1_name and parent2_name:
                                    combinations.append({
                                        'child': child_name,
                                        'parent1': parent1_name,
                                        'parent2': parent2_name
                                    })
                        break
                except Exception as e:
                    continue
            
            # If no combinations found, try alternative approach
            if not combinations:
                # Look for any elements containing breeding information
                breeding_containers = self.driver.find_elements(By.CSS_SELECTOR, "div[class*='breeding'], div[class*='combo'], div[class*='result']")
                for container in breeding_containers:
                    try:
                        text = container.get_attribute('textContent')
                        if child_name.lower() in text.lower():
                            # Try to extract parent names from text
                            links = container.find_elements(By.TAG_NAME, 'a')
                            if len(links) >= 2:
                                parent1 = links[0].get_attribute('textContent').strip()
                                parent2 = links[1].get_attribute('textContent').strip()
                                if parent1 and parent2:
                                    combinations.append({
                                        'child': child_name,
                                        'parent1': parent1,
                                        'parent2': parent2
                                    })
                    except Exception as e:
                        continue
            
        except Exception as e:
            logger.error(f"Error extracting breeding combinations: {e}")
        
        if len(combinations) == 0:
            logger.info(f"No parents found for {child_name}")
        else:
            logger.info(f"Found {len(combinations)} combinations for {child_name}")
        return combinations
    
    def extract_parent_name(self, parent_element):
        """Extract parent name from parent element"""
        try:
            # Try different methods to get the name
            methods = [
                lambda el: el.find_element(By.TAG_NAME, 'a').get_attribute('textContent').strip(),
                lambda el: el.get_attribute('textContent').strip(),
                lambda el: el.find_element(By.CSS_SELECTOR, '[alt]').get_attribute('alt'),
                lambda el: el.find_element(By.TAG_NAME, 'img').get_attribute('alt')
            ]
            
            for method in methods:
                try:
                    name = method(parent_element)
                    if name and len(name) > 0 and not name.startswith('http'):
                        return name
                except:
                    continue
            
            return None
        except Exception as e:
            return None
    
    def scrape_all_combinations(self):
        """Main method to scrape all breeding combinations"""
        logger.info("Starting breeding combinations scraping...")
        
        try:
            # Navigate to page
            self.navigate_to_page()
            
            # Find dropdown input
            input_element = self.find_dropdown_input()
            if not input_element:
                logger.error("Could not find dropdown input. Exiting.")
                return
            
            # Get all options
            options = self.get_dropdown_options(input_element)
            if not options:
                logger.error("Could not get dropdown options. Exiting.")
                return
            
            logger.info(f"Found {len(options)} Pal options to scrape")
            
            # Iterate through each option
            for i, option in enumerate(options):
                logger.info(f"Processing option {i+1}/{len(options)}: {option}")
                print(f"PROGRESS: {i+1}/{len(options)}", flush=True)
                
                try:
                    # Re-find input element (it might have changed)
                    input_element = self.find_dropdown_input()
                    if not input_element:
                        logger.warning("Lost input element, skipping...")
                        continue
                    
                    # Select the option
                    if self.select_option(input_element, option):
                        # Extract breeding combinations
                        combinations = self.extract_breeding_combinations(option)
                        self.breeding_data.extend(combinations)
                    
                    # Very brief delay to avoid overwhelming the server
                    time.sleep(0.1)
                    
                except Exception as e:
                    logger.error(f"Error processing option '{option}': {e}")
                    continue
            
            logger.info(f"Scraping completed. Total combinations found: {len(self.breeding_data)}")
            
        except Exception as e:
            logger.error(f"Error during scraping: {e}")
    
    def save_to_csv(self, filename="palworld_breeding_combinations.csv"):
        """Save breeding data to CSV file"""
        # Save to src-tauri directory where the script is located
        if not os.path.dirname(filename):
            script_dir = os.path.dirname(os.path.abspath(__file__))
            filename = os.path.join(script_dir, filename)
        
        logger.info(f"Saving {len(self.breeding_data)} combinations to {filename}")
        
        try:
            with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = ['child', 'parent1', 'parent2']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                
                writer.writeheader()
                for combination in self.breeding_data:
                    writer.writerow(combination)
            
            logger.info(f"Successfully saved data to {filename}")
            
        except Exception as e:
            logger.error(f"Error saving to CSV: {e}")
    
    def close(self):
        """Close the driver"""
        if self.driver:
            self.driver.quit()

def main():
    """Main function to run the scraper"""
    scraper = None
    try:
        # Initialize scraper (set headless=True to run without GUI)
        scraper = PalworldBreedingScraper(headless=True)
        
        # Scrape all combinations
        scraper.scrape_all_combinations()
        
        # Save to CSV
        scraper.save_to_csv()
        
        print(f"Scraping completed! Found {len(scraper.breeding_data)} breeding combinations.")
        print("Data saved to 'palworld_breeding_combinations.csv'")
        
    except Exception as e:
        logger.error(f"Error in main: {e}")
    finally:
        if scraper:
            scraper.close()

if __name__ == "__main__":
    main() 