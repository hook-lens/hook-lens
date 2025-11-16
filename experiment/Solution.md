## Task 1.

#### - Prop Drilling O

- **currentAlcoholList 上**
    - App.js -> Home.js -> PaginatedItems.js -> Items.js
    - Items.js에서 사용
    
- **pageCount 中**
    - App.js -> Home.js -> PaginatedItems.js
    - PaginatedItems.js에서 사용

- **filteredItemOffset 下**
    - App.js -> Liquor.js
    - 사용되지 않음

#### - Prop Drilling X

- **category 上**
    - App.js -> Home.js -> PaginatedItems.js
    - Home.js과 PaginatedItems.js에서 모두 사용

- **itemOffset 中**
    - App.js -> Home.js -> PaginatedItems.js
    - Home.js와 PaginatedItems.js에서 모두 사용

- **dummyAlcoholList 下**
    - App.js -> Details.js
    - Details.js에서 사용


## Task 2.

- **filteredItemsId**
    - **App.js**, **Liquor.js**, **FilteredPaginatedItems.js**, **FilteredItems.js**
    - filteredItemsId(App.js) → useEffect(Liquor.js) → setFilteredAlcoholList → alcoholList -> useEffect(FilteredPaginatedItems.js) → currentFilteredAlcoholList(FilteredItems.js)

- **dummyQuizList**
    - **App.js**, **Quiz.js**, **RecommendItems.js**, **KakaoRecommendButton.js**
    - dummyQuizList(App.js) → useEffect(Quiz.js) → recommendedAlcohols -> alcohols -> useEffect(RecommendItems.js) → recommended(KakaoRecommendButton.js)