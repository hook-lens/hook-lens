export class Rate {
    constructor(id, userId, userName, aromaId, numberOfStars, reviewText, timestamp) {
        this.id = id;
        this.userId = userId;
        this.userName = userName
        this.aromaID = aromaId;
        this.numberOfStars = numberOfStars;
        this.reviewText = reviewText;
        this.timestamp = timestamp;
    }

    static fromData(data) {
        return Object.assign(new Rate(), data);
    }

    toData() {
        return {
            userId: this.userId,
            userName: this.userName,
            aromaId: this.aromaID,
            numberOfStars: this.numberOfStars,
            reviewText: this.reviewText,
            timestamp: this.timestamp
        }
    }
}
