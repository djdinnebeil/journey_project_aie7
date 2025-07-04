# Merging feature/pdf-rag-chat to main

This feature branch implements PDF upload, indexing, and RAG chat support (frontend & backend).

## GitHub Pull Request (PR) Route
1. Push your branch to GitHub (if not already pushed):
   ```bash
   git push origin feature/pdf-rag-chat
   ```
2. Go to your repository on GitHub.
3. Click "Compare & pull request" for the `feature/pdf-rag-chat` branch.
4. Review the changes, add a description, and create the pull request targeting `main`.
5. After review and approval, merge the PR.

## GitHub CLI Route
1. Push your branch to GitHub (if not already pushed):
   ```bash
   git push origin feature/pdf-rag-chat
   ```
2. Create a pull request using GitHub CLI:
   ```bash
   gh pr create --base main --head feature/pdf-rag-chat --title "PDF RAG Chat" --body "Implements PDF upload, indexing, and RAG chat support."
   ```
3. (Optional) Merge the PR after review:
   ```bash
   gh pr merge --merge
   ```

---

**Note:** Ensure all tests pass and the feature works as expected before merging. 