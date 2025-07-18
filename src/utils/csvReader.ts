export interface BreedingCombination {
  child: string;
  parent1: string;
  parent2: string;
}

export class CSVReader {
  private static breedingData: BreedingCombination[] | null = null;

  static async loadBreedingData(): Promise<BreedingCombination[]> {
    if (this.breedingData) {
      return this.breedingData;
    }

    try {
      // Use Tauri's invoke to read the CSV file
      const { invoke } = await import('@tauri-apps/api/core');
      const csvContent = await invoke('read_breeding_csv') as string;
      
      // Parse CSV content
      const lines = csvContent.split('\n');
      const combinations: BreedingCombination[] = [];
      
      // Skip header line and parse data
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const [child, parent1, parent2] = line.split(',');
          if (child && parent1 && parent2) {
            combinations.push({
              child: child.trim(),
              parent1: parent1.trim(),
              parent2: parent2.trim()
            });
          }
        }
      }
      
      this.breedingData = combinations;
      return combinations;
    } catch (error) {
      console.error('Failed to load breeding data:', error);
      return [];
    }
  }

  static async findChild(parent1: string, parent2: string): Promise<string | null> {
    const combinations = await this.loadBreedingData();
    
    // Check both parent1+parent2 and parent2+parent1 combinations
    const combination = combinations.find(
      combo => 
        (combo.parent1 === parent1 && combo.parent2 === parent2) ||
        (combo.parent1 === parent2 && combo.parent2 === parent1)
    );
    
    return combination ? combination.child : null;
  }

  static async findParents(child: string): Promise<{ parent1: string; parent2: string }[]> {
    const combinations = await this.loadBreedingData();
    
    return combinations
      .filter(combo => combo.child === child)
      .map(combo => ({ parent1: combo.parent1, parent2: combo.parent2 }));
  }

  static async getAllChildren(): Promise<string[]> {
    const combinations = await this.loadBreedingData();
    const children = new Set(combinations.map(combo => combo.child));
    return Array.from(children).sort();
  }

  static async getAllParents(): Promise<string[]> {
    const combinations = await this.loadBreedingData();
    const parents = new Set([
      ...combinations.map(combo => combo.parent1),
      ...combinations.map(combo => combo.parent2)
    ]);
    return Array.from(parents).sort();
  }
} 