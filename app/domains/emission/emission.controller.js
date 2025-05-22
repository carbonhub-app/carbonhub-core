const Company = require('./emission.model').Company;

const CO2_MOLAR_MASS = 44; // g/mol
const AIR_MOLAR_MASS = 29; // g/mol
const AIR_DENSITY = 1.2; // kg/m3
const AIR_VOLUME = 0.5 ** 3; // m3

const ppmToTons = (ppm, co2_molar_mass = CO2_MOLAR_MASS, air_molar_mass = AIR_MOLAR_MASS, air_density = AIR_DENSITY, air_volume = AIR_VOLUME) => {
    return (ppm * co2_molar_mass * air_density * air_volume) / (air_molar_mass * 10 ** 9);
};

const collect = async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            return res.status(400).json({
                status: 'error',
                message: 'API key missing',
                data: {}
            });
        }

        const { ppm, time } = req.body;

        if (!ppm || !time) {
            return res.status(400).json({
                status: 'error',
                message: 'Parameter "ppm" and "time" required',
                data: {}
            });
        }

        const getCompany = await Company.findOne({ apiKey: apiKey });
        if (!getCompany) {
            return res.status(400).json({
                status: 'error',
                message: "Invalid API key",
                data: {}
            });
        }

        const d = new Date(time);
        const year = d.getFullYear().toString();
        const month = `${d.getFullYear()}-${("0" + (d.getMonth()+1).toString()).slice(-2)}`;
        const day = `${d.getFullYear()}-${("0" + (d.getMonth()+1).toString()).slice(-2)}-${("0" + d.getDate().toString()).slice(-2)}`;

        const emissionTon = ppmToTons(ppm);

        const yearlyEntry = getCompany.emissions.yearly.find(e => e.year === year);
        if (yearlyEntry) {
            yearlyEntry.totalTon += emissionTon;
        } else {
            getCompany.emissions.yearly.push({ year, totalTon: emissionTon });
        }

        const monthlyEntry = getCompany.emissions.monthly.find(e => e.month === month);
        if (monthlyEntry) {
            monthlyEntry.totalTon += emissionTon;
        } else {
            getCompany.emissions.monthly.push({ month, totalTon: emissionTon });
        }

        const dailyEntry = getCompany.emissions.daily.find(e => e.day === day);
        if (dailyEntry) {
            dailyEntry.totalTon += emissionTon;
        } else {
            getCompany.emissions.daily.push({ day, totalTon: emissionTon });
        }

        await getCompany.save();

        res.status(200).json({
            status: "success",
            message: "Successfuly add emission data",
            data: {}
        });
    } catch(err) {
        console.error(err);
        return res.status(400).json({
            status: 'error',
            message: process.env.DEBUG ? err.message : "Bad Request",
            data: {}
        });
    }
};

const report = async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            return res.status(400).json({
                status: 'error',
                message: 'API key missing',
                data: {}
            });
        }

        const { ppm, time } = req.body;

        if (!ppm || !time) {
            return res.status(400).json({
                status: 'error',
                message: 'Parameter "ppm" and "time" required',
                data: {}
            });
        }

        const getCompany = await Company.findOne({ apiKey: apiKey });
        if (!getCompany) {
            return res.status(400).json({
                status: 'error',
                message: "Invalid API key",
                data: {}
            });
        }

        const newReport = {
            ppm: ppm,
            ton: ppmToTons(ppm),
            time: time
        }

        getCompany.reports.push(newReport);

        await getCompany.save();

        res.status(200).json({
            status: "success",
            message: "Successfuly add possible emission manipulation report",
            data: newReport
        });
    } catch(err) {
        console.error(err);
        return res.status(400).json({
            status: 'error',
            message: process.env.DEBUG ? err.message : "Bad Request",
            data: {}
        });
    }
};

const companies = async (req, res) => {
    try {
        const getCompany = await Company.find({}, { __v: 0, apiKey: 0, emissions: 0, reports: 0});
        res.status(200).json({
            status: "success",
            message: "Successfuly read all participating companies",
            data: getCompany.map(({ _id, name }) => ({ id: _id, name }))
        });
    } catch(err) {
        console.error(err);
        return res.status(400).json({
            status: 'error',
            message: process.env.DEBUG ? err.message : "Bad Request",
            data: {}
        });
    }
};

const yearly = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                status: 'error',
                message: 'Parameter "id" required',
                data: {}
            });
        }
        
        const getCompany = await Company.findOne( { _id: id }, { 'emissions.yearly': 1, _id: 0 } );
        if (!getCompany) {
            return res.status(400).json({
                status: 'error',
                message: "Invalid Company ID",
                data: {}
            });
        }

        res.status(200).json({
            status: "success",
            message: "Successfully read company's yearly emission",
            data: getCompany.emissions.yearly.map(({ year, totalTon }) => ({ year, totalTon }))
        });
    } catch(err) {
        console.error(err);
        return res.status(400).json({
            status: 'error',
            message: process.env.DEBUG ? err.message : "Bad Request",
            data: {}
        });
    }
};

const monthly = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                status: 'error',
                message: 'Parameter "id" required',
                data: {}
            });
        }

        const getCompany = await Company.findOne( { _id: id }, { 'emissions.monthly': 1, _id: 0 } );
        if (!getCompany) {
            return res.status(400).json({
                status: 'error',
                message: "Invalid Company ID",
                data: {}
            });
        }

        res.status(200).json({
            status: "success",
            message: "Successfuly read company's monthly emission",
            data: getCompany.emissions.monthly.map(({ month, totalTon }) => ({ month, totalTon }))
        });
    } catch(err) {
        console.error(err);
        return res.status(400).json({
            status: 'error',
            message: process.env.DEBUG ? err.message : "Bad Request",
            data: {}
        });
    }
};

const daily = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                status: 'error',
                message: 'Parameter "id" required',
                data: {}
            });
        }

        const getCompany = await Company.findOne( { _id: id }, { 'emissions.daily': 1, _id: 0 } );
        if (!getCompany) {
            return res.status(400).json({
                status: 'error',
                message: "Invalid Company ID",
                data: {}
            });
        }

        res.status(200).json({
            status: "success",
            message: "Successfuly read company's daily emission",
            data: getCompany.emissions.daily.map(({ day, totalTon }) => ({ day, totalTon }))
        });
    } catch(err) {
        console.error(err);
        return res.status(400).json({
            status: 'error',
            message: process.env.DEBUG ? err.message : "Bad Request",
            data: {}
        });
    }
};

module.exports = {
    collect,
    report,
    companies,
    yearly,
    monthly,
    daily
};