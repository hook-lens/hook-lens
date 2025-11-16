import {collection, getDocs, query, orderBy, where} from "firebase/firestore";
import {db} from "../Firebase/service";
import {Rate} from "../Entity/Rate";

const getRate = async (aromaId) => {
  const q = await query(collection(db, "rates"), where('aromaId', '==', aromaId));
  const docs = await getDocs(q);
  return docs.docs.map(doc => Rate.fromData({id: doc.id, ...doc.data()}));
}

export default getRate;
