import axios from 'axios'

export default axios.create({
  baseURL: 'https://www.googleapis.com/analytics/v3/data/ga'
})
