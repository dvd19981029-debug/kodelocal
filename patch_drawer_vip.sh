sed -i '' -e '/{customer.name}/a\
                          {customer.tier && (\
                            <span \
                              className="text-[10px] px-2 py-0.5 rounded-full font-black text-white shadow-sm"\
                              style={{ backgroundColor: customer.tier.badgeColor || "#6366f1" }}\
                            >\
                              VIP {customer.tier.name}\
                            </span>\
                          )}\
' src/components/ecommerce/CustomerDrawer.tsx
