---
'@spore-sdk/core': patch
---

Fix the utf-8 encoding issue, originally the lumos `bytes.bytifyRawString` method can only handle ascii strings
