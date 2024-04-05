import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  employees: Array<Employee> = []

  selectedEmployee: Employee;

  fromDate: Date = new Date();

  requiredWorkers = 3;
  shiftsToGenerate = 10;

  shifts: Array<Shift> = [];

  outputText = "";

  ngOnInit(): void {
    this.getEmployees();
  }

  getEmployees(): void {
    let a = window.localStorage.getItem("employees");

    if (!a) return;

    this.employees = JSON.parse(a);
  }

  saveEmployees(): void {
    let obj = JSON.stringify(this.employees);

    window.localStorage.setItem("employees", obj);
  }

  addEmploy(name: string): void {
    let employee = new Employee(name);
    this.employees.push(employee);

    this.saveEmployees();
  }

  selectEmploy(employee: Employee): void {
    this.selectedEmployee = employee;
    this.generateWorkDays();
  }

  logAmounts(assignedShifts) {
    let logNames = [];
    let uniqueNames = [];

    for (let i = 0; i < assignedShifts.length; i++) {
      for (let j = 0; j < assignedShifts[i].assignedWorkers.length; j++) {
        logNames.push(assignedShifts[i].assignedWorkers[j]);
      }
    }


    for (let i = 0; i < logNames.length; i++) {
      if (!uniqueNames.includes(logNames[i])) {
        uniqueNames.push(logNames[i]);
      }
    }
    let text = "";

    uniqueNames.forEach(name => {
      console.log(name, logNames.filter(item => item == name).length)
      text += `${name} - ${logNames.filter(item => item == name).length} სმენა! <br> \n`
    })

    for (let i = 0; i < assignedShifts.length; i++) {
      let newText = `${assignedShifts[i].date.getDate()} (${assignedShifts[i].isNight ? "ღამე" : "დღე"}) - `;
      for(let j = 0; j < assignedShifts[i].assignedWorkers.length; j++) {
        if (j == assignedShifts[i].assignedWorkers.length - 1) {
          newText += `${assignedShifts[i].assignedWorkers[j]}`
        } else {
          newText += `${assignedShifts[i].assignedWorkers[j]}, `
        }
      }
      newText += `<br> \n`

      text += newText;
    }
    console.log(text)

    this.outputText = text;
  }

  log(): void {
    console.log(this.shiftsToGenerate)
  }

  generateWorkDays(): void {
    let shifts = [];
    let currentDate = new Date(this.fromDate);
    for (let i = 0; i < this.shiftsToGenerate * 2; i++) {
      if (i > 0 && !shifts[i - 1].isNight) {
        let shift = new Shift(i, this.requiredWorkers, shifts[i - 1].date, true);
        shifts.push(shift);
        continue;
      } else if (i > 0) {
        let newDateMS = shifts[i - 1].date.getTime() + (1000 * 60 * 60 * 24);
        let newDate = new Date(newDateMS);
        let shift = new Shift(i, this.requiredWorkers, newDate, false);
        shifts.push(shift);
        continue;
      }
      let newDateMS = currentDate.getTime() + (1000 * 60 * 60 * 24 * (i + 1));
      let newDate = new Date(newDateMS);

      let shift = new Shift(i, this.requiredWorkers, newDate, false);

      shifts.push(shift);
    }
    this.shifts = shifts;
  }

  selectNonWorkDays(event: any): void {
    if (!event.target.value) return;

    let id = parseInt(event.target.value);

    if (!this.selectedEmployee.nonAvailableIds.includes(id)) {
      this.selectedEmployee.nonAvailableIds.push(id);
    }

    this.saveEmployees();
  }

  removeNonWorkDays(id: number): void {
    if (this.selectedEmployee.nonAvailableIds.includes(id)) {
      let index = this.selectedEmployee.nonAvailableIds.indexOf(id)

      if (index == undefined) return;
      this.selectedEmployee.nonAvailableIds.splice(index, 1);
    }

    this.saveEmployees();
  }

  generate(): void {
    this.generateWorkDays();
    let generated = this.assignEmployeesToShiftsFairly(this.employees, this.shifts);
    this.logAmounts(generated);

    console.log(generated);
  }

  shuffleArray(array) {
    // Function to shuffle an array using the Fisher-Yates algorithm
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  assignEmployeesToShiftsFairly(employees, shifts) {
    let assignedShifts = [];
    // Shuffle the array of employees to randomize the order
    this.shuffleArray(employees);

    const averageShiftsPerEmployee = Math.floor(shifts.length / employees.length);

    // Create a copy of the employees array to avoid modifying the original
    let remainingEmployees = [...employees];

    shifts.forEach((shift) => {

      this.shuffleArray(remainingEmployees);

      let availableEmployees = remainingEmployees.filter((employee) =>
        employee.nonAvailableIds.every((day) => (day !== shift.shiftId))
      );

      // remove employees who worked previuse shift
      let assignedWorkers = [];

      let temp = [...availableEmployees]

      if (shift.shiftId > 0) {
        let nonWorking = assignedShifts[shift.shiftId - 1].assignedWorkers;
        for (let i = 0; i < availableEmployees.length; i++) {
          for (let j = 0; j < nonWorking.length; j++) {
            if (availableEmployees[i].name == nonWorking[j]) {
              temp.splice(i, 1);
            }
          }
        }
      }

      availableEmployees = temp;

      // get amount of work per employee

      let temp_2 = [];
      let unique = [];
      let list = [];

      for (let i = 0; i < assignedShifts.length; i++) {
        for (let j = 0; j < assignedShifts[i].assignedWorkers.length; j++) {
          temp_2.push(assignedShifts[i].assignedWorkers[j]);
        }
      }

      for (let i = 0; i < temp_2.length; i++) {
        if (!unique.includes(temp_2[i])) {
          unique.push(temp_2[i]);
        }
      }

      for (let i = 0; i < availableEmployees.length; i++) {
        let obj = {
          name: availableEmployees[i].name,
          amount: temp_2.filter(item => item == availableEmployees[i].name).length
        }
        list.push(obj);
      }

      let minimum = 0;

      let newWorkerList = [];

      let loop = true;

      let index = 0;

      while (loop) {
        if (list.length < this.requiredWorkers) {
          list.forEach(item => {
            newWorkerList.push(item.name);
          })
          loop = false;
          break;
        }

        if (index >= list.length) {
          minimum++;
          index = 0;
        }

        let item = list[index];

        if (item == undefined) debugger

        if (item.amount == minimum) {
          newWorkerList.push(item.name);
        }

        if (newWorkerList.length >= this.requiredWorkers) {
          loop = false;
        }

        index++;
      }

      for (let i = 0; i < newWorkerList.length; i++) {
        assignedWorkers.push(newWorkerList[i]);
      }

      assignedShifts.push({
        shiftId: shift.shiftId,
        assignedWorkers,
        date: shift.date,
        isNight: shift.isNight
      });
    });

    return assignedShifts;
  }
}

class Employee {
  public nonAvailableIds = [];
  public availableShifts = 0;
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}
class Shift {
  public shiftId;
  public requiredWorkers;
  public date;
  public isNight;

  constructor(shiftId, requiredWorkers, date, isNight) {
    this.shiftId = shiftId;
    this.requiredWorkers = requiredWorkers;
    this.date = date;
    this.isNight = isNight;
  }
}