function UUID() {
  var d = new Date().getTime();
  var d2 = (typeof performance !== "undefined" && performance.now && performance.now() * 1000) || 0;
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function add_zero(n) {
  return ("0" + n).slice(-2);
}

const $ = document;
$.$ = document.querySelector;

class App {
  #all_tasks = [];
  #cur_time_input = { hour: 0, minute: 0, second: 0 };
  #display = {
    name: $.$("[data-display='name']"),
    time: $.$("[data-display='time']"),
    start_btn: $.$("[data-btn='start']"),
    stop_btn: $.$("[data-btn='stop']"),
    cancel_btn: $.$("[data-btn='cancel']"),
    complete_btn: $.$("[data-btn='complete']"),
    id: null,
  };
  #interval = null;

  constructor() {
    const old_tasks = localStorage.getItem("todos");
    this.#all_tasks = old_tasks ? JSON.parse(old_tasks) : this.#all_tasks;
    this.#update_tasks_list();
  }

  get #new_task() {
    return {
      name: $.$("[data-input='task-name']").value,
      type: $.$("[data-input='task-type']:checked").value,
      time: { ...this.#cur_time_input },
      name_input: $.$("[data-input='task-name']"),
    };
  }

  handleTimeInput(args) {
    const [hour, minute, second] = args[0];
    this.#cur_time_input = { hour, minute, second };
  }

  handleAdd(e) {
    e.preventDefault();
    const { name, type, time } = this.#new_task;
    if (!name) return alert("Please input your task name.");
    const completed = Object.values(time).every((i) => i === 0);
    this.#new_task.name_input.value = "";
    this.#all_tasks.push({ name, type, time, completed, id: UUID() });
    this.#update_tasks_list();
    this.#save_to_local();
  }

  #update_tasks_list() {
    console.log(this.#display.id);
    const ul = $.$("[data-role='all_tasks_container']");
    ul.innerHTML = "";
    this.#all_tasks.forEach((task) => {
      const { name, type, time, id, completed } = task;
      const { hour, minute, second } = time;
      const cur_sel_class = id === this.#display.id ? "class='bg-blue-100'" : "class='bg-white'";
      const status_span = completed
        ? `<span class="text-green-600 text-sm">Completed</span>`
        : `<span class="text-red-500 text-sm">Not Completed</span>`;
      ul.innerHTML += `
        <li ${cur_sel_class} onclick="my_app.change_current_display('${id}')">
            <div class="flex-center">
              <span class="text-black font-medium">${name}</span>
              <span class="text-sm font-light text-slate-500">${type}</span>
            </div>
            <div class="flex-center text-black">
              <span class="text-xs">Time: ${add_zero(hour)}:${add_zero(minute)}:${add_zero(second)}</span>
              ${status_span}
            </div>
        </li>
      `;
    });
  }

  change_current_display(id) {
    if (this.#interval) return alert("Please stop or cancel the current task first.");
    this.update_display(id);
  }

  handle_start(id) {
    const selected_task = this.#all_tasks.find((t) => t.id === id);
    if (!id || selected_task.completed) return;
    const countdown = () => {
      const selected_time = selected_task.time;
      let { hour, minute, second } = selected_time;
      if (second !== 0) {
        second--;
      } else if (minute !== 0) {
        minute--;
        second = 59;
      } else if (hour !== 0) {
        hour--;
        minute = 59;
        second = 59;
      } else {
        //todo implement completed feature
      }
      selected_time.hour = hour;
      selected_time.minute = minute;
      selected_time.second = second;
      this.update_display(id);
      this.#update_tasks_list();
      this.#save_to_local();
    };
    if (!this.#interval) {
      this.#interval = setInterval(countdown, 1000);
    }
  }

  handle_stop() {
    if (this.#interval) {
      clearInterval(this.#interval);
      this.#interval = null;
    }
  }

  handle_cancel(id) {
    if (!id) return;
    this.handle_stop(id);
    this.#all_tasks = this.#all_tasks.filter((t) => t.id !== id);
    this.#update_tasks_list();
    this.update_display();
    this.#save_to_local();
  }

  handle_complete(id) {
    this.handle_stop(id);
    this.#all_tasks = this.#all_tasks.map((t) => {
      if (t.id !== id) return t;
      else return { ...t, completed: true };
    });
    this.#save_to_local();
    this.#update_tasks_list();
  }

  update_display(id = "") {
    let cur_task;
    if (id) {
      cur_task = this.#all_tasks.find((t) => t.id === id);
    } else {
      cur_task = { name: "Select or Add a task...", time: { hour: 0, minute: 0, second: 0 }, complete: "" };
    }
    const { hour, minute, second } = cur_task.time;
    this.#display.id = id;
    this.#display.name.innerText = cur_task.name;
    this.#display.start_btn.setAttribute("onclick", `my_app.handle_start("${id}")`);
    this.#display.stop_btn.setAttribute("onclick", `my_app.handle_stop()`);
    this.#display.cancel_btn.setAttribute("onclick", `my_app.handle_cancel("${id}")`);
    this.#display.complete_btn.setAttribute("onclick", `my_app.handle_complete("${id}")`);
    this.#display.time.innerHTML = `
      <span class="time">${add_zero(hour)}</span>
      <span class="time">${add_zero(minute)}</span>
      <span class="time">${add_zero(second)}</span>
      <span class="time-label">HOURS</span>
      <span class="time-label">MINUTES</span>
      <span class="time-label">SECONDS</span>
    `;
    this.#update_tasks_list();
  }

  #save_to_local() {
    localStorage.setItem("todos", JSON.stringify(this.#all_tasks));
  }
}

const my_app = new App();
