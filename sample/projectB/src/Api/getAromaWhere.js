import {collection, getDocs, query} from "firebase/firestore";
import {db} from "../Firebase/service";
import {Aroma} from "../Entity/Aroma";

const getAromaWhere = async (where) => {
    const q = await query(collection(db, "Aromas"), ...where);
    const docs = await getDocs(q);
    return docs.docs.map(doc => Aroma.fromData({ id: doc.id, ...doc.data() }));
};

export default getAromaWhere;