import { getNetwork, getNode, shortAddress } from "@/services/utils";
import { ANS } from "@alph-name-service/ans-sdk";
import { useEffect, useState } from "react";


export default function AlephiumDomain({ addressParams }:{addressParams:string}){
const [ansName, setAnsName] = useState<string>('');

const fetchAnsProfile = async (address:string) => {
	try {
		const ans = new ANS("mainnet", false, getNode());
		const profile = await ans.getProfile(address);
		if (profile?.name) {
			setAnsName(profile.name);
		}
	} catch (error) {
		console.error('Error fetching ANS:', error);
	}
};


useEffect(() => {
	if (addressParams) {
		fetchAnsProfile(addressParams);
	}
}, [addressParams]);


return(
   <>
   {ansName !== '' ? ansName : shortAddress(addressParams)}
   </>
)
}