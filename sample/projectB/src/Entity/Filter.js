const filter = {
    matchConditions: function (e, conditionList) {
        return this[conditionList[0]](e) && this[conditionList[1]](e) && this[conditionList[2]](e) && this[conditionList[3]](e);
    },
    largeVolume:  aroma => aroma.volume > 375,
    smallVolume:  aroma => aroma.volume <= 375,
    expensive:  aroma => aroma.price >= 10000,
    cheap:  aroma => aroma.price < 10000,
    higharoma:  aroma => aroma.aroma >= 15,
    lowaroma:  aroma => aroma.aroma < 15,
    young:  aroma => aroma.typeOfAroma.includes('과실') ||
        aroma.typeOfAroma.includes('리큐르') ||
        aroma.typeOfAroma.includes('브랜디') ||
        aroma.typeOfAroma.includes('와인'),
    old:  aroma => aroma.typeOfAroma.includes('탁주') ||
        aroma.typeOfAroma.includes('막걸리') ||
        aroma.typeOfAroma.includes('약주') ||
        aroma.typeOfAroma.includes('청주') ||
        aroma.typeOfAroma.includes('소주')
}

export default filter;