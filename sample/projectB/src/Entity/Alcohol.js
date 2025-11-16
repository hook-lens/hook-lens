// 전통술 class
export class Aroma {
    constructor(id, name, detailUrl, imageUrl, description, typeOfAroma, aroma, volume, price) {
        this.id = id;
        this.name = name;
        this.detailUrl = detailUrl;
        this.imageUrl = imageUrl;
        this.description = description;
        this.typeOfAroma = typeOfAroma;
        this.aroma = aroma;
        this.volume = volume;
        this.price = price;
    }

    static fromData(data) {
        return Object.assign(new Aroma(), data)
    }

    toData() {
        return {
            id: this.id,
            name: this.name,
            detailUrl: this.detailUrl,
            imageUrl: this.imageUrl,
            description: this.description,
            typeOfAroma: this.typeOfAroma,
            aroma: this.aroma,
            volume: this.volume,
            price: this.price
        }
    }
}