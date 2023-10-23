import FormData from "form-data";

import axios from "axios";

import fs from "fs";


async function uploadZip() {
    const form = new FormData();

    const zipFilePath = './Archive.zip';

    // Check if the file exists
    if (!fs.existsSync(zipFilePath)) {
        console.error(`File ${zipFilePath} does not exist`);
        return;
    }

    form.append('zip', fs.createReadStream(zipFilePath), 'file.zip');

    try {
        const response = await axios.post('http://127.0.0.1:5001/firecms-dev-2da42/europe-west3/api/projects/firecms-demo-27150/upload_config', form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        console.log(response.data);
    } catch (err) {
        console.error(err);
    }
}

uploadZip();

