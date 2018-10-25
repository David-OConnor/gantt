import axios from "axios"
import * as DateFns from 'date-fns'
import * as React from 'react'
import * as ReactDOM from 'react-dom'


const emptyColor = '#efefff'

const BASE_URL = 'https://sched-chart.herokuapp.com/api/'
// const BASE_URL = 'http://127.0.0.1:8000/api/'

// const fmHStyle = {
//     gridRow: '3 / 4',
//     fontWeight: 700,
//     fontSize: '.8em',
//     padding: 12,
//     alignSelf: 'center',
//     justifySelf: 'center'
// }

// const fmVStyle = {
//     gridRow: '4 / 5',
//     alignSelf: 'start',
//     justifySelf: 'center'
// }

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const monthNumDays = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function toIso(date: Date): string {
    return date.getFullYear() + '-' + (date.getMonth() + 1).toString() + '-' + date.getUTCDate()
}

function save(events: Event[]) {
    console.log("SAVING...")

    // todo unknown issue getting map to work here.
    const processedEvents: any = []
    for (let event of events) {
        processedEvents.push(
            {
                id: event.id,
                name: event.name,
                org: event.org.id,
                start: toIso(event.start),
                end: toIso(event.end),
            }
        )
    }
    axios.post(
        BASE_URL + 'save', processedEvents).then(      
        (resp) => {
            if (resp.data.success) {
                console.log('Saved')
            } else {
                console.log("Save failed")
            }
        }
    )
}

function dateFromPart(date: Date, part: number, val: number) {
    // For use with the EditDate component.  part is 0 for year, 1 for mo, 2 for day
    // val is the new val
    
    let newDate
    if (part === 0) {
        val += 2000  // We displayed dates as 2 digit.
        return new Date(val, date.getMonth(), date.getUTCDate())
    } else if (part === 1) {
        val -= 1  // To convert back from 1-12 visual range to 0 - 11.
        if (val >= 11) {
            val -= 11
        } else if (val < 0) {
            val += 11
        }
        return new Date(date.getFullYear(), val, date.getUTCDate())
    } else if (part === 2) {
        if (val > monthNumDays[date.getMonth()]) {
            val -= monthNumDays[date.getMonth()]
        } else if (val <= 0) {
            val += monthNumDays[date.getMonth()]
        }
        return new Date(date.getFullYear(), date.getMonth(), val)
    } else {
        console.log("Invalid date part")
        return new Date(1999, 9, 9)
    }
}

const EditDate = ({date, cb}: {date: Date, cb: Function}) => {
    return (
        <>
        <input 
            style={{width: 70, margin: 'auto'}}
            type="number"
            value={date.getFullYear().toString().substr(-2)}
            onChange={(e) => {cb(dateFromPart(date, 0, parseInt(e.target.value)))}}
        ></input>
        <input 
            style={{width: 70, margin: 'auto'}}
            type="number"
            value={date.getMonth() + 1}
            onChange={(e) => {cb(dateFromPart(date, 1, parseInt(e.target.value)))}}
        ></input>
        <input 
            style={{width: 70, margin: 'auto'}}
            type="number"
            value={date.getUTCDate()}
            onChange={(e) => {cb(dateFromPart(date, 2, parseInt(e.target.value)))}}
        ></input>
        </>
    )
}

const EditRow = ({i, event, orgs, cb}: {i: number, event: Event, 
        orgs: Organization[], cb: Function}) => {
            const baseStyle = {gridRowStart: i + 2, gridRowEnd: i + 3}
    return (
        <>
        <div style={{...baseStyle, gridColumn: '1 / 2'}}>
            <input 
                type="text"
                value={event.name}
                onChange={(e) => {cb(event.id, 'name', e.target.value)}}
            ></input>
        </div>

        <div style={{...baseStyle, gridColumn: '2 / 3'}}>
            <select
                value={event.org.id}
                onChange={(e) => {cb(event.id, 'org', e.target.value)}}
            >
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
        </div>

        <div style={{...baseStyle, display: 'float', gridColumn: '3 / 4'}}>
            <EditDate date={event.start} cb={(val: number) => cb(event.id, 'start', val)} />
        </div>

        <div style={{...baseStyle, gridColumn: '4 / 5'}}>
            <EditDate date={event.end} cb={(val: number) => cb(event.id, 'end', val)} />
        </div>
        </>
    )
}


const Editor = ({events, orgs, changeEvent, addEvent}: {events: Event[], orgs: Organization[], 
        changeEvent: Function, addEvent: Function}) => {
    const headerStyle = {gridRow: '1 / 2', margin: 'auto'}
    
    return (
        <>
        <button onClick={() => addEvent(nextEventId(events))}>Add event</button>
        <form style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
            gridTemplateRows: '1fr '.repeat(events.length + 1),
            // justifyItems: 'center',
            alignItems: 'center',
            gridGap: 10,
            background: '#ddeeff',
        }}>

            <div style={{...headerStyle, gridColumn: '1 / 2'}}>
                <h3>Name</h3>
            </div>
            <div style={{...headerStyle, gridColumn: '2 / 3'}}>
                <h3>Squadron</h3>
            </div>
            <div style={{...headerStyle, gridColumn: '3 / 4'}}>
                <h3>Start</h3>
            </div>
            <div style={{...headerStyle, gridColumn: '4 / 5'}}>
                <h3>End</h3>
            </div>
            
            {events.sort((a: any, b: any) => b.id - a.id).map((e, i) => 
                <EditRow key={e.id} i={i} event={e} orgs={orgs} cb={changeEvent} />)}
        </form>
        </>

    )    
}

const Chart = ({events, month, changeMonth}: {events: Event[], 
        month: [number, number], changeMonth: Function}) => {
    // month is a (year, month) tuple.
    const numCols = monthNumDays[month[1]]
    // I don't think JS has a built-in range.
    const days = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
        17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]

    events = events.sort((a: any, b: any) => a.org.order - b.org.order)

    // Setting eventRows ahead of time lets us group events with the same name
    // on the same row.
    // let eventRows = new Map(), row
    let nameRows = new Map()
    let row_i = 2  // Offset 1 for 1-based css grid, and a second for header row.
    for (let event of events) {
        // Use lower case so this same-name check isn't case-sens
        if (nameRows.has(event.name.toLowerCase())) {
            continue  // Keep the lower index so we don't skip rows.
        }
        nameRows.set(event.name.toLowerCase(), row_i)
        row_i += 1
    }
    
    return (
        <div>
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <button style={{width: 50, fontSize: '1.5em'}} onClick={() => changeMonth(-1)}>⤆</button>
            <h3>{monthNames[month[1]] + ' ' + month[0]}</h3>
            <button style={{width: 50, fontSize: '1.5em'}} onClick={() => changeMonth(1)}>⤇</button>

        </div>

            {/* // todo could split the grid into a separate area from headings. */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr '.repeat(numCols),
                gridTemplateRows: '40px '.repeat(events.length + 1),
                alignItems: 'center',
                backgroundColor: emptyColor
            }}>

                {days.map(d => <div key={d} style={{
                    gridRow: '0 / 1', gridColumnStart: d, gridColumnEnd: d+1
                }}><h5>{d}</h5></div>)}

                {events.map(e => 
                    <div key={e.id} 
                        style={{
                            gridRowStart: nameRows.get(e.name.toLowerCase()),
                            gridRowEnd: nameRows.get(e.name.toLowerCase()) + 1,
                            
                            // Allow wrapping across multiple months.
                            gridColumnStart: e.start.getMonth() < month[1] ? 1 : e.start.getUTCDate(),
                            gridColumnEnd: e.end.getMonth() > month[1] ? numCols : e.start.getUTCDate() + 1,

                            maxHeight: 36,
                            paddingTop: 5,
                            paddingBottom: 5,
                            fontSize: '.8em',
                            // todo should just have a font color property for orgs.
                            color: e.org.name ==='4 FW' ? '#ffffff' : 'black',
                            backgroundColor: e.org.color,
                        }}>
                        {e.name + " " + (e.start.getUTCDate() === e.end.getUTCDate() ? e.start.getUTCDate() :
                            e.start.getUTCDate() + " - " + e.end.getUTCDate())}
                    </div>)}
            </div>
        </div>
    )
}

function nextEventId(events: Event[]): number {
    return Math.max(...events.map(e => e.id) as any) + 1
}

function eventOnDay(event: Event, date: [number, number, number]): boolean {
    const date2 = new Date(date[0], date[1], date[2])
    return event.start <= date2 && date2 <= event.end
}

function eventStartsOnDay(event: Event, date: [number, number, number]): boolean {
   return event.start.getFullYear() === date[0] 
   && event.start.getMonth() === date[1] && event.start.getUTCDate() === date[2]
}

function dateToStr(date: Date): string {
    return date.getFullYear() + '-' + date.getMonth() + '-' + date.getUTCDate()
}

interface Organization {
    id: number
    name: string
    color: string
    order: number
}

interface Event {
    id: number    
    name: string
    org: Organization
    start: Date
    end: Date
}

interface MainProps {}

interface MainState {
    orgs: Organization[]
    events: Event[] 
    page: number  // 0 for chart, 1 for editor
    // months range from 0 to 11.
    month: [number, number]  // [year, month]
}


class Main extends React.Component<MainProps, MainState> {
    constructor(props: MainProps) {
        super(props)
        
        const currentDate = new Date()
        
        this.state = {
            orgs: [],
            events: [],
            page: 0,
            month: [currentDate.getFullYear(), currentDate.getMonth()]
        }

        this.changeEvent = this.changeEvent.bind(this)
        this.addEvent = this.addEvent.bind(this)
        this.changeMonth = this.changeMonth.bind(this)
    }

    changeEvent(id: number, attr: string, v: any) {
        // Processes the value from event.target.
         let event = this.state.events.filter(e => e.id === id)[0]


        if (attr === 'org') {
            v = this.state.orgs.filter(o => o.id === parseInt(v))[0]
        }

        event[attr] = v
        const updated = [...this.state.events.filter(e => e.id !== id), event]
        this.setState({events: updated})
    }

    addEvent(id: number) {
        // Processes the value from event.target.
        let newEvent: Event = {
            id: id,
            name: "",
            org: this.state.orgs[0],
            start: new Date(this.state.month[0], this.state.month[1], 26),
            end: new Date(this.state.month[0], this.state.month[1], 27),
        }

        this.setState({events: [...this.state.events, newEvent]})
    }

    changeMonth(change: number) {
        // change: -1 for back, +1 for forward.
        let newMonth = new Date(this.state.month[0], this.state.month[1], 5)
        newMonth.setMonth(newMonth.getMonth() + change)
        this.setState({month: [newMonth.getFullYear(), newMonth.getMonth()]})
    }

    // changeDatePart(attr: string, val: number, part: number) {
    //     // attr is 'start' or 'end', val is the number, part is 0 for year, 1 for mo, 2 for day.
    // }

    componentDidMount() {
        axios.get(BASE_URL + 'orgs').then(
            (resp) => {
                this.setState({orgs: resp.data.results})

                // Don't load events until orgs are loaded, since events ref orgs.
                axios.get(BASE_URL + 'events').then(
                    (resp) => {
                        let events = []
                        for (let event of resp.data.results) {
                            events.push({
                                id: event.id,
                                name: event.name,
                                org: this.state.orgs.filter(o => o.id === parseInt(event.org))[0],
                                // The Date constructor should automatically parse the ISO date input.
                                start: new Date(event.start), 
                                end: new Date(event.end)
                            })
                        }
                        this.setState({events: events})
                    }
                )

            }            
        )

    }

    render() {
        const currentMoStart = new Date(this.state.month[0], this.state.month[1], 1)
        // todo real month end
        const currentMoEnd = new Date(this.state.month[0], this.state.month[1], 28)
        const eventsThisMonth = this.state.events.filter(e => 
            e.start <= currentMoEnd && e.end >= currentMoStart
        )

        return (
            <div style={{display: 'flex', flexDirection: 'column', textAlign: 'center'}}>
                <h1>4FW Sync Matrix</h1>

                <button 
                    style={{marginBottom: 20}}
                    onClick={() => save(this.state.events)}>
                    Save
                </button>

                <button 
                    style={{marginBottom: 20}}
                    onClick={() => {
                        this.setState({page: this.state.page === 0 ? 1 : 0})
                        save(this.state.events)
                    }}>
                    {this.state.page === 0 ? "Edit" : "View"}
                </button>

                {this.state.page === 0 ? 
                    <Chart events={eventsThisMonth} month={this.state.month} changeMonth={this.changeMonth}/> : 
                    <Editor events={this.state.events} orgs={this.state.orgs} 
                        changeEvent={this.changeEvent} addEvent={this.addEvent}/>
                }

            </div>
        )
    }
}

ReactDOM.render(<Main />, document.getElementById('root') as HTMLElement)
