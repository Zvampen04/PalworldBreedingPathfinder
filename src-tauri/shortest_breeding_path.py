#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Palworld Breeding Path Finder

This script finds the shortest breeding paths between Pals using the breeding combinations data.
It supports two modes:
1. Given two parents, find the child
2. Given one parent and target child, find the 5 shortest breeding paths

Usage:
    python shortest_breeding_path.py -p1 "Pal1" -p2 "Pal2"  # Find child from two parents
    python shortest_breeding_path.py -p1 "Pal1" -c "TargetPal"  # Find paths from parent to child
    python shortest_breeding_path.py -p2 "Pal1" -c "TargetPal"  # Find paths from parent to child
"""

import sys
import os

# Fix encoding issues on Windows by setting environment variables
if sys.platform.startswith('win'):
    os.environ['PYTHONIOENCODING'] = 'utf-8'

import argparse
import csv
import sys
import os
from collections import defaultdict, deque
from typing import Dict, List, Tuple, Set, Optional
import time


class BreedingPathFinder:
    def __init__(self, csv_file: str = "palworld_breeding_combinations.csv", json_mode: bool = False):
        # If csv_file is just a filename, look for it in the appropriate directory
        if not os.path.dirname(csv_file):
            # Check if we're running as a PyInstaller binary
            if getattr(sys, 'frozen', False):
                # Running as compiled binary - look in the same directory as the executable
                exe_dir = os.path.dirname(sys.executable)
                csv_file = os.path.join(exe_dir, csv_file)
            else:
                # Running as script - look in the same directory as this script
                script_dir = os.path.dirname(os.path.abspath(__file__))
                csv_file = os.path.join(script_dir, csv_file)
        self.csv_file = csv_file
        self.json_mode = json_mode  # Suppress prints when in JSON mode
        self.breeding_data: Dict[Tuple[str, str], str] = {}  # (parent1, parent2) -> child
        self.reverse_breeding: Dict[str, List[Tuple[str, str]]] = defaultdict(list)  # child -> [(parent1, parent2)]
        self.all_pals: Set[str] = set()
        self.load_breeding_data()
    
    def load_breeding_data(self):
        """Load breeding combinations from CSV file"""
        try:
            with open(self.csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    child = row['child'].strip()
                    parent1 = row['parent1'].strip()
                    parent2 = row['parent2'].strip()
                    
                    if child and parent1 and parent2:
                        # Store both orders of parents (since breeding is commutative)
                        self.breeding_data[(parent1, parent2)] = child
                        self.breeding_data[(parent2, parent1)] = child
                        
                        # Store reverse mapping for pathfinding
                        self.reverse_breeding[child].append((parent1, parent2))
                        
                        # Track all Pal names
                        self.all_pals.update([child, parent1, parent2])
            
            if not self.json_mode:
                print(f"Loaded {len(self.breeding_data)//2} breeding combinations for {len(self.all_pals)} Pals")
            
        except FileNotFoundError:
            print(f"Error: Could not find {self.csv_file}")
            print("Please run the breeding scraper first to generate the data.")
            sys.exit(1)
        except Exception as e:
            print(f"Error loading breeding data: {e}")
            sys.exit(1)
    
    def find_child_from_parents(self, parent1: str, parent2: str) -> Optional[str]:
        """Find the child Pal that results from breeding two parents"""
        # Normalize case for lookup
        parent1_norm = self.normalize_pal_name(parent1)
        parent2_norm = self.normalize_pal_name(parent2)
        
        child = self.breeding_data.get((parent1_norm, parent2_norm))
        return child
    
    def normalize_pal_name(self, name: str) -> str:
        """Normalize Pal name for case-insensitive matching"""
        # Try exact match first
        if name in self.all_pals:
            return name
        
        # Try case-insensitive match
        name_lower = name.lower()
        for pal in self.all_pals:
            if pal.lower() == name_lower:
                return pal
        
        return name  # Return original if no match found
    
    def find_shortest_paths(self, start_parent: str, target_child: str, max_paths: int = 20, max_seconds: Optional[float] = None) -> List[List[str]]:
        """Find the shortest breeding paths from a parent to target child using BFS, with optional time and path count limits"""
        start_parent = self.normalize_pal_name(start_parent)
        target_child = self.normalize_pal_name(target_child)
        
        if start_parent not in self.all_pals:
            if not self.json_mode:
                print(f"❌ Unknown parent Pal: {start_parent}")
            return []
        
        if target_child not in self.all_pals:
            if not self.json_mode:
                print(f"❌ Unknown target Pal: {target_child}")
            return []
        
        if start_parent == target_child:
            return [[start_parent]]
        
        # BFS to find all shortest paths
        queue = deque([(start_parent, [start_parent])])  # (current_pal, path)
        visited_depths = {start_parent: 0}  # Track minimum depth to reach each Pal
        paths = []
        min_depth = float('inf')
        start_time = time.time()
        
        while queue:
            if max_seconds is not None and (time.time() - start_time) > max_seconds:
                break
            if max_paths and len(paths) >= max_paths:
                break
            current_pal, path = queue.popleft()

            # Skip if we've found shorter paths already
            if len(path) > min_depth:
                continue

            # Prevent cycles: do not allow the start parent or target child as an intermediate step
            # (except as the first or last node)
            if len(path) > 1:
                intermediates = set(path[1:])
                if start_parent in intermediates or target_child in intermediates:
                    continue

            # Try all possible breeding combinations where current_pal is one parent
            for other_parent in self.all_pals:
                if other_parent == current_pal:
                    continue

                child = self.breeding_data.get((current_pal, other_parent))
                if child:
                    new_path = path + [f"{current_pal} + {other_parent} = {child}"]

                    if child == target_child:
                        # Found a path to target
                        if len(new_path) <= min_depth:
                            min_depth = len(new_path)
                            # Check for cycles in the full path (including the result)
                            intermediates = set(new_path[1:-1])
                            if start_parent in intermediates or target_child in intermediates:
                                continue
                            paths.append(new_path)
                    else:
                        # Continue searching from this child
                        depth = len(new_path)
                        if child not in visited_depths or visited_depths[child] >= depth:
                            visited_depths[child] = depth
                            queue.append((child, new_path))

        # Always return up to max_paths, even if time was the limiting factor
        return paths[:max_paths] if max_paths else paths
    
    def group_paths_by_common_prefix(self, paths: List[List[str]]) -> dict:
        """Group paths by common prefixes to create an expandable tree structure"""
        if not paths:
            return {}
            
        def build_tree(path_list, depth=0):
            if not path_list:
                return {}
            
            # Group by the step at current depth
            groups = defaultdict(list)
            completed_paths = []
            
            for path in path_list:
                if depth >= len(path):
                    completed_paths.append(path)
                else:
                    step = path[depth]
                    groups[step].append(path)
            
            result = {
                "completed": completed_paths,
                "branches": {}
            }
            
            for step, step_paths in groups.items():
                if len(step_paths) == 1 and depth + 1 >= len(step_paths[0]):
                    # Single complete path
                    result["branches"][step] = {
                        "completed": step_paths,
                        "branches": {}
                    }
                else:
                    # Multiple paths or incomplete paths - recurse
                    result["branches"][step] = build_tree(step_paths, depth + 1)
            
            return result
        
        return build_tree(paths)
    
    def format_expandable_paths(self, start_parent: str, target_child: str, max_paths: int = 20, max_seconds: Optional[float] = None) -> dict:
        """Return breeding paths in an expandable format suitable for UI"""
        paths = self.find_shortest_paths(start_parent, target_child, max_paths, max_seconds)
        
        if not paths:
            return {
                "success": False,
                "message": f"No breeding path found from {start_parent} to {target_child}",
                "suggestions": {
                    "start": self.get_similar_pal_names(start_parent),
                    "target": self.get_similar_pal_names(target_child)
                }
            }
        
        # Convert paths to a more structured format
        structured_paths = []
        
        for i, path in enumerate(paths):
            structured_path = {
                "id": i,
                "steps": [],
                "total_steps": len(path) - 1
            }
            
            for j, step in enumerate(path):
                if j == 0:
                    # Starting Pal
                    structured_path["steps"].append({
                        "type": "start",
                        "pal": step,
                        "step_number": 0
                    })
                else:
                    # Breeding step
                    if " + " in step and " = " in step:
                        parts = step.split(" = ")
                        if len(parts) == 2:
                            breeding_pair = parts[0]
                            result = parts[1]
                            structured_path["steps"].append({
                                "type": "breed",
                                "parents": breeding_pair,
                                "result": result,
                                "step_number": j,
                                "is_final": (result == target_child)
                            })
            
            structured_paths.append(structured_path)
        
        # Group by common prefixes for expandable display
        grouped = self.group_paths_with_prefixes(structured_paths)
        
        return {
            "success": True,
            "start_parent": start_parent,
            "target_child": target_child,
            "total_paths": len(paths),
            "min_steps": len(paths[0]) - 1 if paths else 0,
            "paths": grouped
        }
    
    def group_paths_with_prefixes(self, structured_paths: List[dict]) -> List[dict]:
        """Recursively group paths by all common prefixes (infinite nesting), prioritizing early differences."""
        if not structured_paths:
            return []

        def recursive_group(paths, depth=0):
            if not paths:
                return []
            if len(paths) == 1:
                return [{
                    "type": "single",
                    "path": paths[0],
                    "alternatives": []
                }]

            # --- Prioritize early differences: sort paths by the step at this depth ---
            def step_key(path):
                steps = path["steps"]
                if depth < len(steps):
                    step = steps[depth]
                    if step["type"] == "breed":
                        return (step["parents"], step["result"])
                    elif step["type"] == "start":
                        return ("start", step["pal"])
                return ("", "")
            paths = sorted(paths, key=step_key)
            # --- END prioritize ---

            # Group by the step at current depth
            groups = {}
            singles = []
            for path in paths:
                steps = path["steps"]
                if depth >= len(steps):
                    singles.append(path)
                else:
                    # Use a tuple of step type and relevant fields as the group key
                    step = steps[depth]
                    if step["type"] == "start":
                        key = ("start", step["pal"])
                    else:
                        key = ("breed", step["parents"], step["result"])
                    if key not in groups:
                        groups[key] = []
                    groups[key].append(path)

            result = []
            # Add any completed singles
            for single in singles:
                result.append({
                    "type": "single",
                    "path": single,
                    "alternatives": []
                })

            # For each group, recurse
            for key, group_paths in groups.items():
                if len(group_paths) == 1:
                    # Only one path in this group, treat as single
                    result.append({
                        "type": "single",
                        "path": group_paths[0],
                        "alternatives": []
                    })
                else:
                    # Find the common prefix up to this depth+1
                    common_steps = [group_paths[0]["steps"][i] for i in range(depth+1)]
                    children = recursive_group(group_paths, depth+1)
                    result.append({
                        "type": "group",
                        "common_steps": common_steps,
                        "children": children,
                        "count": len(group_paths)
                    })

            # --- FIX: Promote a valid path to the top if all top-level nodes are groups ---
            if all(node["type"] == "group" for node in result) and len(result) > 0:
                # Find the shortest path in the input and promote it as a single at the top
                shortest = min(paths, key=lambda p: p["total_steps"])
                result.insert(0, {
                    "type": "single",
                    "path": shortest,
                    "alternatives": []
                })
            # --- END FIX ---

            return result

        return recursive_group(structured_paths, 0)
    
    def paths_share_prefix(self, path1: dict, path2: dict, min_shared: int = 1) -> bool:
        """Check if two paths share a common prefix but are not identical"""
        steps1 = path1["steps"]
        steps2 = path2["steps"]
        
        # Don't group paths of different lengths or identical paths
        if len(steps1) != len(steps2):
            return False
            
        # Check if paths are identical (if so, don't group them as "alternatives")
        identical = True
        shared = 0
        
        for i in range(len(steps1)):
            step1 = steps1[i]
            step2 = steps2[i]
            
            # Compare steps properly based on type
            if step1.get("type") == "start" and step2.get("type") == "start":
                if step1.get("pal") == step2.get("pal"):
                    shared += 1
                else:
                    identical = False
                    break
            elif step1.get("type") == "breed" and step2.get("type") == "breed":
                if step1.get("parents") == step2.get("parents") and step1.get("result") == step2.get("result"):
                    shared += 1
                else:
                    identical = False
                    break
            else:
                identical = False
                break
        
        # If paths are identical, don't group them
        if identical:
            return False
            
        # Only group if they share some prefix but differ in final steps
        # For meaningful grouping, they should share all but the last 1-2 steps
        return shared >= len(steps1) - 2 and shared < len(steps1)
    
    def find_common_prefix(self, paths: List[dict]) -> List[dict]:
        """Find the common prefix steps among a group of paths"""
        if not paths:
            return []
        
        min_length = min(len(path["steps"]) for path in paths)
        common_steps = []
        
        for i in range(min_length):
            # Get the step at position i from all paths
            steps_at_position = [path["steps"][i] for path in paths]
            
            # Check if all steps at this position are identical
            first_step = steps_at_position[0]
            all_same = True
            
            for step in steps_at_position[1:]:
                # Compare steps properly based on type
                if first_step.get("type") != step.get("type"):
                    all_same = False
                    break
                elif first_step.get("type") == "start":
                    if first_step.get("pal") != step.get("pal"):
                        all_same = False
                        break
                elif first_step.get("type") == "breed":
                    if (first_step.get("parents") != step.get("parents") or 
                        first_step.get("result") != step.get("result")):
                        all_same = False
                        break
            
            if all_same:
                common_steps.append(first_step)
            else:
                break
        
        return common_steps
    
    def print_breeding_result(self, parent1: str, parent2: str):
        """Print the result of breeding two parents"""
        child = self.find_child_from_parents(parent1, parent2)
        
        if child:
            print(f"\nBreeding Result:")
            print(f"   {parent1} + {parent2} = {child}")
        else:
            print(f"\nNo breeding combination found for {parent1} + {parent2}")
            
            # Suggest similar Pal names if typos might be involved
            suggestions1 = self.get_similar_pal_names(parent1)
            suggestions2 = self.get_similar_pal_names(parent2)
            
            if suggestions1:
                print(f"   Did you mean one of these for '{parent1}': {', '.join(suggestions1[:3])}")
            if suggestions2:
                print(f"   Did you mean one of these for '{parent2}': {', '.join(suggestions2[:3])}")
    
    def print_shortest_paths(self, start_parent: str, target_child: str):
        """Print the shortest breeding paths from parent to child"""
        # Use JSON format if in JSON mode, otherwise use simple text output
        if self.json_mode:
            import json
            result = self.format_expandable_paths(start_parent, target_child)
            print(json.dumps(result, indent=2))
        else:
            paths = self.find_shortest_paths(start_parent, target_child)
            
            if not paths:
                print(f"No breeding path found from {start_parent} to {target_child}")
                return
            
            print(f"Found {len(paths)} shortest breeding path(s) from {start_parent} to {target_child}:")
            print(f"(Path length: {len(paths[0])-1} breeding steps)")
            
            for i, path in enumerate(paths, 1):
                print(f"Path {i}:")
                print(f"  Start: {path[0]}")
                for step in path[1:]:
                    print(f"  Step: {step}")
    
    def get_similar_pal_names(self, name: str, max_suggestions: int = 5) -> List[str]:
        """Get Pal names that are similar to the given name (simple string matching)"""
        name_lower = name.lower()
        suggestions = []
        
        for pal in self.all_pals:
            if name_lower in pal.lower() or pal.lower() in name_lower:
                suggestions.append(pal)
        
        return suggestions[:max_suggestions]


def main():
    parser = argparse.ArgumentParser(
        description="Find shortest breeding paths between Palworld Pals",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Find child from two parents
  python shortest_breeding_path.py -p1 "Lamball" -p2 "Cattiva"
  
  # Find paths from parent to target child
  python shortest_breeding_path.py -p1 "Lamball" -c "Anubis"
  python shortest_breeding_path.py -p2 "Cattiva" -c "Jetragon"
        """
    )
    
    parser.add_argument('-p1', '--parent1', type=str, help='First parent Pal name')
    parser.add_argument('-p2', '--parent2', type=str, help='Second parent Pal name')
    parser.add_argument('-c', '--child', type=str, help='Target child Pal name')
    parser.add_argument('--csv', type=str, default='palworld_breeding_combinations.csv',
                       help='Path to breeding combinations CSV file')
    parser.add_argument('--json', action='store_true', 
                       help='Output results in JSON format (for UI integration)')
    parser.add_argument('--max-paths', type=int, default=20,
                       help='Maximum number of paths to find (default: 20)')
    parser.add_argument('--max-seconds', type=float, default=None,
                       help='Maximum time (in seconds) to search for paths (overrides max-paths if set)')
    
    args = parser.parse_args()
    
    # Validate arguments
    provided_args = sum([bool(args.parent1), bool(args.parent2), bool(args.child)])
    
    if provided_args != 2:
        print("Error: Exactly two arguments must be provided")
        print("   Use -p1 and -p2 to find child from parents")
        print("   Use -p1/-p2 and -c to find breeding paths")
        parser.print_help()
        sys.exit(1)
    
    # Initialize the path finder
    finder = BreedingPathFinder(args.csv, json_mode=args.json)
    
    if len(finder.all_pals) == 0:
        if not args.json:
            print("❌ No breeding data found. Please run the scraper first.")
        sys.exit(1)
    
    # Execute the appropriate function based on provided arguments
    if args.parent1 and args.parent2:
        # Mode 1: Find child from two parents
        if args.json:
            import json
            child = finder.find_child_from_parents(args.parent1, args.parent2)
            result = {
                "success": bool(child),
                "parent1": args.parent1,
                "parent2": args.parent2,
                "child": child if child else None
            }
            print(json.dumps(result, indent=2))
        else:
            finder.print_breeding_result(args.parent1, args.parent2)
        
    elif args.parent1 and args.child:
        # Mode 2: Find paths from parent1 to child
        if args.json:
            import json
            result = finder.format_expandable_paths(args.parent1, args.child, args.max_paths, args.max_seconds)
            print(json.dumps(result, indent=2))
        else:
            finder.print_shortest_paths(args.parent1, args.child)
        
    elif args.parent2 and args.child:
        # Mode 3: Find paths from parent2 to child  
        if args.json:
            import json
            result = finder.format_expandable_paths(args.parent2, args.child, args.max_paths, args.max_seconds)
            print(json.dumps(result, indent=2))
        else:
            finder.print_shortest_paths(args.parent2, args.child)


if __name__ == "__main__":
    main()
