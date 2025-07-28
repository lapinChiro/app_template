# AI Prompt Optimization Specification

Executable specification for generating AI-optimized prompts.

## Core Rules

### 1. Zero Ambiguity

```yaml
forbidden_phrases:
  - "appropriately"
  - "if necessary"
  - "when needed"
  - "as required"
  - "consider"
  - "might"

required_elements:
  - explicit_subject: true  # WHO performs the action
  - explicit_object: true   # WHAT is being acted upon
  - explicit_condition: true # WHEN to perform action
```

### 2. Decision Automation

```yaml
decision_patterns:
  - trigger: "file_count"
    thresholds:
      small: [1, 2]
      medium: [3, 5]
      large: [6, null]
    
  - trigger: "path_contains"
    patterns:
      security: ["auth", "login", "password", "token", "crypto"]
      types: ["interface", "type", ".d.ts"]
      performance: ["optimize", "performance", "speed"]
```

### 3. Execution Sequences

```yaml
workflows:
  small:
    sequence: ["test:red", "implement", "test:green", "qa"]
    
  medium:
    sequence: ["test:red", "implement", "test:green", "test:blue", "review", "qa"]
    
  large:
    sequence: ["tracker:start", "test:red", "implement", "test:green", "test:blue", "architect", "review", "qa", "tracker:complete"]
```

## Prompt Templates

### Basic Structure

```typescript
interface PromptStructure {
  conditions: Condition[];      // When to execute
  workflow: string[];          // Execution sequence
  parallelizable: string[][];  // Groups of parallel operations
  errorHandling: ErrorRule[];  // Error response rules
  validation: Check[];         // Completion criteria
}
```

### Condition Definition

```typescript
interface Condition {
  type: "numeric" | "pattern" | "boolean";
  field: string;
  operator: ">" | "<" | "==" | "contains" | "matches";
  value: number | string | boolean;
  action: string;
}
```

### Example Generation

```yaml
input:
  task: "implement user authentication"
  scope: "medium"
  
output:
  prompt: |
    ## Task: Implement user authentication
    
    ### Execution (3-5 files detected)
    1. Use Task tool with subagent_type: "test", prompt: "red"
    2. Implement authentication logic
    3. Use Task tool with subagent_type: "test", prompt: "green"
    4. Use Task tool with subagent_type: "test", prompt: "blue"
    5. Use Task tool with subagent_type: "security"  # auth keyword detected
    6. Use Task tool with subagent_type: "review"
    7. Use Task tool with subagent_type: "qa"
    
    ### Parallel Operations
    - File reads: Execute Read commands in single parallel block
    - Validation: Run "npm run lint", "npm test", "npm run typecheck" in parallel
    
    ### Error Handling
    - TypeScript errors: Stop immediately, fix, then continue
    - Build errors: Stop immediately, fix, then continue
    - Lint warnings: Note and continue
```

## Processing Rules

### 1. Phrase Replacement

```yaml
replacements:
  "handle appropriately": "follow the specific steps below"
  "if complex": "if file_count > 5"
  "optimize if needed": "run perf agent when response_time > 200ms"
  "validate properly": "execute: npm run lint && npm run typecheck && npm test"
```

### 2. Workflow Selection

```typescript
function selectWorkflow(context: Context): string[] {
  if (!context.hasCodeChanges) return ["implement", "qa"];
  
  const fileCount = context.modifiedFiles.length;
  if (fileCount <= 2) return workflows.small;
  if (fileCount <= 5) return workflows.medium;
  return workflows.large;
}
```

### 3. Special Case Injection

```typescript
function injectSpecialCases(workflow: string[], context: Context): string[] {
  const result = [...workflow];
  
  if (context.paths.some(p => securityPatterns.test(p))) {
    result.splice(result.indexOf("review"), 0, "security");
  }
  
  if (context.hasTypeDefinitions) {
    result.splice(result.indexOf("review"), 0, "typesafe");
  }
  
  return result;
}
```

## Quality Checklist

```yaml
validation_rules:
  - id: "no_ambiguous_terms"
    check: "!content.match(/appropriately|properly|if needed/)"
    
  - id: "explicit_sequences"
    check: "all execution steps have explicit order"
    
  - id: "numeric_thresholds"
    check: "all conditions use numeric comparisons"
    
  - id: "parallel_marked"
    check: "independent operations marked as parallel"
    
  - id: "error_handling"
    check: "all error types have explicit handlers"
```

## Usage by SubAgent

```typescript
// SubAgent implementation
class PromptOptimizer {
  private spec = loadYAML('./PROMPT_GUIDE.md');
  
  optimize(rawPrompt: string, context: Context): string {
    let prompt = this.replaceAmbiguousPhrases(rawPrompt);
    prompt = this.injectWorkflow(prompt, context);
    prompt = this.addErrorHandling(prompt);
    prompt = this.markParallelOperations(prompt);
    
    this.validate(prompt);
    return prompt;
  }
}
```
