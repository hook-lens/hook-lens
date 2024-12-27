## Task 1. 정답

### Prop Drilling O

- **currentAlcoholList 上**
    - App.js -> Home.js -> PaginatedItems.js -> Items.js
    - Items.js에서 사용
    
- **pageCount 中**
    - App.js -> Home.js -> PaginatedItems.js
    - PaginatedItems.js에서 사용

- **filteredItemOffset 下**
    - App.js -> Liquor.js
    - 사용되지 않음

### Prop Drilling X
- **category 上**
    - App.js -> Home.js -> PaginatedItems.js
    - Home.js에서 사용

- **itemOffset 中**

- **dummyAlcoholList 下**
    - App.js -> Details.js
    - 사용되지 않음



## Task 2. 정답
### App.js → Liquor.js → FilteredPaginatedItems.js → FilteredItems.js

- filteredItemsId → effect_10(Liquor.js) → filteredAlcoholList → effect_4(FilteredPaginatedItems.js) → currentAlcoholList(FilteredItems.js)