// Components for header and sidebar are created here
// Vue already needs to be included for this to work
//

const CalendarDay = {
    template: `
        <div :class="[
            'day',
            'col-sm',
            'p-2',
            'border',
            'border-left-0',
            'border-top-0',
            'text-truncate',
            date.getMonth() === new Date(2018, 7, 1).getMonth() ? '':'d-none d-sm-inline-block bg-light text-muted'
        ]">
            <h5 class="row align-items-center">
                <span class="date col-1">{{ date.getDate() }}</span>
                <small class="col d-sm-none text-center text-muted">{{ date.toLocaleDateString('en-US', { weekday: 'long' }) }}</small>
                <span class="col-1"></span>
            </h5>
            <slot>
                <p class="d-sm-none">No events</p>
            </slot>
        </div>
    `,
    props: ['date']
}

const CalendarWeek = {
    components: {
        'calendar-day': CalendarDay
    },
    computed: {
        days: function() {
            let tmp = [];
            for(let i = 0; i < 7; i++) {
                let d = new Date(this.start_date.getTime());
                d.setDate(this.start_date.getDate()+i);
                let daily_events = [];
                console.log('Events: ');
                console.log(this.events);
                for(let i = 0; i < this.events.length; i++) {
                    let evt = this.events[i];
                    console.log(evt);
                    if(evt['date'].getDay() === d.getDay()) {
                        daily_events.push(evt);
                    }
                }
                tmp.push({'date': d, 'events': daily_events});
            }
            return tmp;
        }
    },
    template: `
        <div class="row border border-right-0 border-bottom-0">
            <template v-for="day in days">
                <calendar-day :date="day['date']">
                    <a v-for="evt in day['events']" :class="['event d-block p-1 pl-2 pr-2 mb-1 rounded text-truncate small', evt['bg'], 'text-white']" :title="evt['title']">{{ evt.title }}</a>
                </calendar-day>
            </template>
        </div>
    `,
    props: ['start_date', 'events']
}

const AppCalendar = {
    components: {
        'calendar-day': CalendarDay,
        'calendar-week': CalendarWeek
    },
    template: `
        <div>
            <div class="row d-none d-sm-flex p-1 bg-dark text-white">
                <h5 class="col-sm p-1 text-center">Sunday</h5>
                <h5 class="col-sm p-1 text-center">Monday</h5>
                <h5 class="col-sm p-1 text-center">Tuesday</h5>
                <h5 class="col-sm p-1 text-center">Wednesday</h5>
                <h5 class="col-sm p-1 text-center">Thursday</h5>
                <h5 class="col-sm p-1 text-center">Friday</h5>
                <h5 class="col-sm p-1 text-center">Saturday</h5>
            </div>
            <calendar-week :start_date="new Date(2018, 6, 29)" :events="[]"></calendar-week>
            <calendar-week :start_date="new Date(2018, 7, 5)" :events="[{bg:'bg-primary', title:'Test Event 1', date: new Date(2018, 7, 6)},{bg:'bg-success', title:'Test Event 2', date: new Date(2018, 7, 8)},{bg:'bg-danger', title:'Test Event 3', date: new Date(2018, 7, 8)}]"></calendar-week>
            <calendar-week :start_date="new Date(2018, 7, 12)" :events="[]"></calendar-week>
            <calendar-week :start_date="new Date(2018, 7, 18)" :events="[{bg:'bg-primary', title:'Test Event with Super Duper Really Long Title', date: new Date(2018, 7, 20)}]"></calendar-week>
            <calendar-week :start_date="new Date(2018, 7, 25)" :events="[]"></calendar-week>
            <calendar-week :start_date="new Date(2018, 8, 1)" :events="[]"></calendar-week>
        </div>
    `
};

const AppNav = {
    template: `
        <nav class="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
            <a class="navbar-brand col-sm-3 col-md-2 mr-0" href="#">Graf Long Term Server</a>
        </nav>
    `
};

const AppSidebar = {
    template: `
        <nav class="col-md-2 d-none d-md-block bg-light sidebar">
            <div class="sidebar-sticky">
                <ul class="nav flex-column">
                    <li v-for="page in pages" class="nav-item">
                        <router-link :to="page['route']" class="nav-link" active-class="active">
                            <span :data-feather="page['icon']"></span>
							{{ page['text'] }}
                        </router-link>
                    </li>
                </ul>
            </div>
        </nav>
    `,
    props: ['pages']
}

const AppMain = {
    template: `
        <main role="main" class="col-md-9 ml-sm-auto col-lg-10 px-4">
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2">{{ title }}</h1>
            </div>
  
            <slot>
            Page Specific Content Goes Here
            </slot>
  
        </main>
    `,
	props: ['title']
}

const AppMap = {
    template: '<div class="my-4 w-100" id="map"></div>',
    mounted: function() {
        setupMap();
    }
};

const RobotControl = {
    template: `
        <div>
            <h3>This is a test</h3>
            <app-map></app-map>
        </div>
    `,
    components: {
        'app-map': AppMap
    }
};

const AppTaskSubmit = {
    template: `
        <form>
            <div class="form-group">
                <label for="username">Name</label>
                <input type="text" class="form-control" id="usernameInput" placeholder="Your Name Here">
            </div>
            <div class="form-group">
                <label for="taskType">Type of Task</label>
                <select class="form-control" id="taskType">
                    <option>Generate new Building Map</option>
                    <option>Generate Wifi Strength Map</option>
                    <option>Photograph POI</option>
                    <option>Check Cardboard Levels</option>
                    <option>Look for Person</option>
                </select>
            </div>
            <div class="form-group">
				<div class="form-check form-check-inline">
				  <input class="form-check-input" type="radio" name="inlineRadioOptions" id="inlineRadio1" value="option1">
				  <label class="form-check-label" for="inlineRadio1">Complete Before</label>
				</div>
				<div class="form-check form-check-inline">
				  <input class="form-check-input" type="radio" name="inlineRadioOptions" id="inlineRadio2" value="option2">
				  <label class="form-check-label" for="inlineRadio2">Complete After</label>
				</div>
                <input type="date" class="form-control" id="taskDate">
                <input type="time" class="form-control" id="taskTime">
            </div>
            <button type="submit" class="btn btn-primary">Schedule</button>
        </form>
    `
};

const routes = [
    { path: '/', redirect: '/map' },
    { path: '/map', component: AppMap },
    { path: '/tasks', component: AppCalendar },
    { path: '/schedule_task', component: AppTaskSubmit },
    { path: '/robot_control', component: RobotControl }
];

const router = new VueRouter({
    routes: routes
});

const app = new Vue({
    router: router,
	data: function() {
		return {
            routes: [
				{route: '/map', title: 'Building Map', text: 'Building Map', icon: 'home'},
				{route: '/tasks', title: 'Scheduled Tasks', text: 'View Scheduled Tasks', icon: 'calendar'},
				{route: '/schedule_task', title: 'Schedule a Task', text: 'Schedule a Task', icon: 'plus'},
				{route: '/people', title: 'People', text: 'People', icon: 'users'},
				{route: '/robot_control', title: 'Robot Control', text: 'Robots', icon: 'terminal'},
				{route: '/map_history', title: 'Saved Maps', text: 'Map Directory', icon: 'file-text'},
				{route: '/points', title: 'Points of Interest', text: 'Points of Interest', icon: 'flag'}
            ],
		}
	},
    components: {
        'app-nav': AppNav,
        'app-sidebar': AppSidebar,
        'app-main': AppMain,
    },
    template: `
        <div>
            <app-nav></app-nav>
            <div class="container-fluid">
                <div class="row">
                    <app-sidebar :pages="routes"></app-sidebar>
  
                    <app-main :title="routes.find(obj => {return this.$route.path === obj.route})['title']">
                        <router-view></router-view>
                    </app-main>
                </div>
            </div>
        </div>
	`
}).$mount('#app_root');

