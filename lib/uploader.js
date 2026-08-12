import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import cheerio from 'cheerio'

export function ImgBB(filePath) {
    return new Promise(async (resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            return reject(new Error('File not found'))
        }
        try {
            const form = new FormData()
            form.append('source', fs.createReadStream(filePath), {
                filename: `image-${Date.now()}.jpg`
            })
            form.append('type', 'file')
            form.append('action', 'upload')

            const { data } = await axios({
                method: 'POST',
                url: 'https://imgbb.com/json',
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Accept': 'application/json',
                    'Referer': 'https://imgbb.com/',
                    'Origin': 'https://imgbb.com',
                    ...form.getHeaders()
                },
                data: form
            })

            if (!data?.image?.url) {
                return reject(new Error('Upload failed'))
            }
            resolve(data.image.url)
        } catch (err) {
            reject(new Error(String(err)))
        }
    })
}

export function webp2mp4File(filePath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) return reject(new Error('File not found'))

        const form = new FormData()
        form.append('new-image-url', '')
        form.append('new-image', fs.createReadStream(filePath))
        form.append('upload', 'Upload!')

        axios({
            method: 'post',
            url: 'https://ezgif.com/webp-to-mp4',
            data: form,
            maxRedirects: 5,
            headers: {
                ...form.getHeaders(),
                'User-Agent': 'Mozilla/5.0'
            }
        }).then(({ data }) => {
            const $ = cheerio.load(data)
            const file = $('input[name="file"]').attr('value')
            const action = $('form.ajax-form').attr('action') || ('https://ezgif.com/webp-to-mp4/' + file)

            if (!file) {
                return reject(new Error('Failed to upload sticker to ezgif'))
            }

            const nextForm = new FormData()
            nextForm.append('file', file)
            nextForm.append('background', '#ffffff')
            nextForm.append('repeat', '1')
            nextForm.append('convert', 'Convert WebP to MP4!')

            axios({
                method: 'post',
                url: action,
                data: nextForm,
                maxRedirects: 5,
                headers: {
                    ...nextForm.getHeaders(),
                    'User-Agent': 'Mozilla/5.0',
                    'Referer': action
                }
            }).then(({ data }) => {
                const $2 = cheerio.load(data)
                const src =
                    $2('div#output > p.outfile > video > source').attr('src') ||
                    $2('div#output video source').attr('src') ||
                    $2('video source').attr('src')

                if (!src) {
                    return reject(new Error('Failed to get converted mp4 URL'))
                }

                const result = src.startsWith('http') ? src : 'https:' + src
                resolve({ status: true, message: 'success', result })
            }).catch(reject)
        }).catch(reject)
    })
}
