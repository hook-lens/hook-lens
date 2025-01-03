import {collection, getDocs} from "firebase/firestore";
import {db, firebase} from "../Firebase/service";
import {Aroma} from "../Entity/Aroma";

const getAllAromas = async () => {
  const querySnapshot = await getDocs(collection(db, "Aromas"));
  return querySnapshot.docs.map(doc => Aroma.fromData({id: doc.id, ...doc.data()}));
};

export default getAllAromas;
