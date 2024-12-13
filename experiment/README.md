# HookLens 실험
본 실험은 **React** 어플리케이션 개발 과정에서 발생하는 **Chanlleges**를 해결하기 위한 시각화 도구인 **HookLens**의 효과를 검증하기 것을 목표로 함.

## 📌 실험 개요
### Challenges
1. **State Management** : **Prop Drilling** 패턴으로 인한 데이터 전달 비효율성
    - Prop Drilling :  부모 컴포넌트가 하위 자식 컴포넌트에 데이터를 전달하기 위해 불필요한 props를 중간 컴포넌트로 전달하는 패턴을 말함.
2. **Dependency Management for useEffect**: Dependency Array의 변수 추적 및 관리 어려움
3. **Performance Optimization**: 렌더링 성능 최적화를 위한 React Hook 최적화 방법

## ⚙️ 실험 설계
### Task 1. Prop Drilling Recognition

#### 1️⃣ **Task 정의**  
- 부모 컴포넌트에서 자식 컴포넌트가 사용하지 않는 불필요한 props를 포함하여 전달하는 경우를 찾아내야 함.
- props가 필요한 자식 컴포넌트가 있더라도 중간 계층 컴포넌트에서 props를 내려보내기만 하고, 해당 데이터를 직접적으로 사용하지 않는 경우도 해당

#### 2️⃣ **측정 항목**
- **Prop 개수**: Prop Drilling에 해당하는 prop의 총 개수
- **Drill 횟수**: 각 prop이 중간 컴포넌트를 거쳐 자식에게 전달된 횟수
- **사용 여부**: 최종 자식 컴포넌트가 prop를 실제로 사용하는지 여부

예시)  
```jsx
// Parent Component
const Parent = () => {
    const prop1 = 'prop1';
    const prop2 = 'prop2';
    const prop3 = 'prop3';
    return <Child1 prop1={prop1} prop2={prop2} prop3={prop3} />;
}

// Child1 Component
const Child1 = ({ prop1, prop2, prop3 }) => {
    return <Child2 prop1={prop1} prop2={prop2} />;
}

// Child2 Component
const Child2 = ({ prop1, prop2 }) => {
    return <Child3 prop1={prop1} />;
}

// GrandChild Component
const Child3 = ({ prop1 }) => {
    return <div>{prop1}</div>;
}
```
정답)

**Prop 개수**  
    - **3개**:
    - `prop1`, `prop2`, `prop3`.

**Drill 횟수**  
   - 각 prop이 중간 컴포넌트를 거쳐 자식으로 전달된 횟수:
     - `prop1`: 3번 (Parent → Child1 → Child2 → Child3)
     - `prop2`: 2번 (Parent → Child1 → Child2)
     - `prop3`: 1번 (Parent → Child1)

**사용 여부**  
   - 최종적으로 사용된 prop: `prop1` (Child3 컴포넌트에서 사용)
   - 사용되지 않은 props: `prop2`, `prop3`는 자식 계층에서 전혀 사용되지 않음

#### 3️⃣ **난이도 설정**
Prop Drilling의 복잡성을 세 가지 난이도로 구분하여 실험합니다:

1. **상 (High)**  
   - 자식 컴포넌트에서 모든 prop을 `props.propName` 형태로 직접 사용
   - 중간 컴포넌트의 수가 많고, Prop Drilling의 깊이가 4 이상인 경우

2. **중 (Medium)**  
   - 자식 컴포넌트에서 prop을 구조 분해 할당 후 사용
   - Prop Drilling의 깊이는 3 이하

3. **하 (Low)**  
   - 중간 컴포넌트 없이 부모 -> 자식으로 직접 props 전달 

### Project Structure
```
project
├── README.md
├── src
│   ├── Page
│   │   ├── Details.js
│   │   ├── Home.js
│   │   ├── Layout.js
│   │   ├── Liquor.js
│   │   ├── Login.js
│   │   └── Quiz.js
│   │   └── Register.js
│   └── Styles
│   │   ├── ...
│   └── Store
│   │   ├── ...
│   └── Component
│   │   ├── ...
│   └── Entity
│   │   ├── ...
│   └── Api
│   │   ├── ...
│   └── Asset
│   │   ├── ...
├── App.js
├── index.js
└── package.json
```

## Task 정답

### App.js → Home.js → PaginatedItems → Items.js

- **pageCount 中**
    - App.js -> Home.js -> PaginatedItems.js
    - PaginatedItems.js에서 사용
- **setPageCount 中**
    - App.js -> Home.js -> PaginatedItems.js
    - PaginatedItems.js에서 사용
- **currentAlcoholList 上**
    - App.js -> Home.js -> PaginatedItems.js -> Items.js
    - Items.js에서 사용
- **setCurrentAlcoholList 中**
    - App.js -> Home.js -> PaginatedItems.js
    - PaginatedItems.js에서 사용
- **itemOffset 中**
    - App.js -> Home.js -> PaginatedItems.js
    - PaginatedItems.js에서 사용
- **setItemOffset 中**
    - App.js -> Home.js -> PaginatedItems.js
    - PaginatedItems.js에서 사용
- **category 上**
    - App.js -> Home.js -> PaginatedItems.js
    - Home.js에서 사용

### App.js → Liquor.js → FilteredPaginatedItems.js → FilteredItems.js

- **dummyAlcoholList**
    - App.js -> Liquor.js **下**
    - 사용되지 않음
- **filteredAlcoholList(alcoholList) 中**
    - App.js -> Liquor.js -> FilteredPaginatedItems
    - FilteredPaginatedItems.js에서 사용
- **filteredItemOffset 下**
    - App.js -> Liquor.js
    - 사용되지 않음

### App.js → Details.js → KakaoRecommendButton.js

- **dummyAlcoholList 下**
    - App.js -> Details.js
    - 사용되지 않음
- **setDummyAlcoholList 下**
    - App.js -> Details.js
    - 사용되지 않음