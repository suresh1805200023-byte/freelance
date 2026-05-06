import countriesFlags from "./countriesFlags";

const getCountryFlag = (data) => {
    for(let country in countriesFlags) {
        if(country === data || countriesFlags[country].alias === data) {
            const flag = countriesFlags[country];
            return {
                ...flag,
                mini: flag.mini?.replace("http://", "https://"),
                normal: flag.normal?.replace("http://", "https://"),
            };
        }
    }

    return {};
}

export default getCountryFlag;