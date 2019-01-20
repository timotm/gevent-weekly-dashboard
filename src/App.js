import React, { useEffect, useState } from 'react'
import './App.css'
import GoogleLogin from 'react-google-login'
import api from './api.js'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import * as R from 'ramda'

const yyyyMmDdToEpoch = yyyyMmDd => {
  const re = /(\d{4})(\d{2})(\d{2})/
  return new Date(yyyyMmDd.replace(re, '$1-$2-$3')).getTime()
}

const weekNumberFromYyyyMmDd = date => {
  const id = new Date(yyyyMmDdToEpoch(date))
  const d = new Date(Date.UTC(id.getFullYear(), id.getMonth(), id.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  var weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-${weekNo}`
}

const Graph = ({ accessToken }) => {
  const [data, setData] = useState()
  useEffect(() => {
    api
      .get('/', {
        params: {
          ids: process.env.REACT_APP_GA_ID,
          'start-date': '180daysAgo',
          'end-date': 'yesterday',
          metrics: 'ga:totalEvents',
          dimensions: 'ga:date, ga:eventAction',
          access_token: accessToken
        }
      })
      .then(({ data: { rows } }) =>
        rows.map(([date, wat, count]) => ({ date, wat, count, weekNumber: weekNumberFromYyyyMmDd(date) }))
      )
      .then(d => {
        const byWeeksArray = R.pipe(
          R.groupBy(R.prop('weekNumber')),
          R.toPairs
        )(d)

        const data = byWeeksArray.map(([weekNumber, contents]) => ({
          weekNumber,
          ...contents.reduce((acc, { wat, count }) => {
            acc[wat] = Number(count)
            return acc
          }, {})
        }))
        setData(data)
      })
  }, [])

  const fills = [
    '#023fa5',
    '#7d87b9',
    '#bec1d4',
    '#d6bcc0',
    '#bb7784',
    '#8e063b',
    '#4a6fe3',
    '#8595e1',
    '#b5bbe3',
    '#e6afb9',
    '#e07b91',
    '#d33f6a',
    '#11c638',
    '#8dd593',
    '#c6dec7',
    '#ead3c6',
    '#f0b98d',
    '#ef9708',
    '#0fcfc0',
    '#9cded6',
    '#d5eae7',
    '#f3e1eb',
    '#f6c4e1',
    '#f79cd4'
  ]

  return data ? (
    <div style={{ width: '80%', height: 600 }}>
      <h2 style={{ margin: '0 auto', width: '50%' }}>{process.env.REACT_APP_CHART_TITLE}</h2>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis domain={['auto', 'auto']} dataKey="weekNumber" />
          <YAxis />
          <Tooltip />
          <Legend />
          {Object.keys(
            data.reduce((acc, e) => {
              Object.keys(R.omit(['weekNumber'], e)).forEach(k => {
                if (k !== 'date') {
                  acc[k] = 1
                }
              })
              return acc
            }, {})
          ).map((k, i) => (
            <Bar key={`item-${i}`} dataKey={k} stackId="a" fill={fills[i % fills.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  ) : null
}

const App = () => {
  const [token, setToken] = useState()

  const responseGoogle = ({ accessToken }) => {
    setToken(accessToken)
  }

  return token ? (
    <Graph accessToken={token} />
  ) : (
    <GoogleLogin
      clientId={process.env.REACT_APP_CLIENT_ID}
      scope="https://www.googleapis.com/auth/analytics"
      buttonText="Login"
      prompt="consent"
      isSignedIn="true"
      onSuccess={responseGoogle}
      onFailure={responseGoogle}
    />
  )
}

export default App
