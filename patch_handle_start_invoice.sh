sed -i '' -e '/const tipo: '\''01'\'' | '\''03'\''/i\
    setSelectedCustomerId(matchedCust?.id || "");\
' src/app/pos/page.tsx
