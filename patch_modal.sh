sed -i '' -e '/customerTiers: any\[\];/a\
  custCustomDiscountPct?: string;\
  setCustCustomDiscountPct?: (val: string) => void;\
' src/app/pos/components/modals/PosCustomerFormModal.tsx

sed -i '' -e '/customerTiers,/a\
  custCustomDiscountPct,\
  setCustCustomDiscountPct,\
' src/app/pos/components/modals/PosCustomerFormModal.tsx
