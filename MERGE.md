# Merge Instructions for User-Configurable K Parameter Feature

This feature adds the ability for users to configure how many chunks are retrieved during RAG (Retrieval-Augmented Generation) search, improving the flexibility and control over the AI's responses.

## Changes Made

### Backend (API)
- Added optional `k` parameter to `ChatRequest` model with default value of 3
- Fixed `ChatOpenAI` usage to properly handle model parameter and use `astream` method
- Updated RAG search to use user-provided k value instead of hardcoded 3

### Frontend
- Added UI control (number input) to let users configure k value (1-10 range)
- Control only appears when a PDF is uploaded and indexed
- Added state management for k value with default of 3

## Merge Options

### Option 1: GitHub Pull Request (Recommended)

1. Push the feature branch to GitHub:
   ```bash
   git push origin feature/user-configurable-k-parameter
   ```

2. Go to your GitHub repository and create a new Pull Request:
   - Base branch: `main`
   - Compare branch: `feature/user-configurable-k-parameter`

3. Review the changes and merge via GitHub's interface

### Option 2: GitHub CLI

1. Push the feature branch:
   ```bash
   git push origin feature/user-configurable-k-parameter
   ```

2. Create and merge the PR using GitHub CLI:
   ```bash
   gh pr create --title "Add user-configurable k parameter for RAG search" --body "This feature allows users to configure how many chunks are retrieved during RAG search, improving response quality and control."
   gh pr merge --merge
   ```

3. Switch back to main and pull changes:
   ```bash
   git checkout main
   git pull origin main
   ```

## Testing the Feature

After merging, test the feature by:

1. Upload a PDF document
2. Verify the "Chunks to retrieve" control appears
3. Try different k values (1-10) and observe how the AI responses change
4. Test with k=1 (minimal context) vs k=10 (maximum context)

## Benefits

- **Better Control**: Users can adjust context retrieval based on their needs
- **Improved Responses**: More context for complex questions, less for simple ones
- **Performance**: Users can balance response quality vs token usage
- **User Experience**: Intuitive control that appears when relevant 